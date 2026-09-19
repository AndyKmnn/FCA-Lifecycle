/**
 * Grid Smash - the one seeded generator for every number in the demo.
 *
 *   node scripts/generate-data.mjs
 *
 * Writes public/data/{profile,limits,regions}.json and prints the computed results
 * that docs/DEMO_SCRIPT.md quotes. Fully deterministic: fixed seed, UTC clock,
 * no wall-clock or network input. Re-running always produces identical files.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'data')

// ---------------------------------------------------------------- constants
const SEED = 20260405
const YEAR = 2026 // 365 days, starts on a Thursday
const STEPS_PER_DAY = 96 // 15-minute resolution
const DAYS = 365
const N = DAYS * STEPS_PER_DAY
const H = 0.25 // hours per step

const PEAK_MW = 5.8 // demo script: peak about 5.8 MW
const MEAN_MW = 2.1 // demo script: average about 2.1 MW
const CONNECTION_MW = 6.0
const GUARANTEED_MIN_MW = 2.5
const MARGIN_EUR_PER_MWH = 250 // assumption from the demo script

const TARGET = {
  staticHours: 610,
  staticEnergy: 410,
  dynamicHours: 240,
  dynamicEnergy: 150,
  dayAheadHours: 95,
  dayAheadEnergy: 55,
}

// ---------------------------------------------------------------- utilities
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gauss = (x, mu, sigma, amp) => amp * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
const round = (v, p) => Number(v.toFixed(p))
const iso = (dayOfYear) =>
  new Date(Date.UTC(YEAR, 0, 1 + dayOfYear)).toISOString().slice(0, 10)
const weekdayOf = (dayOfYear) => new Date(Date.UTC(YEAR, 0, 1 + dayOfYear)).getUTCDay() // 0 = Sun

// Travel peaks that lift a whole day. Easter Sunday 2026 is 5 April.
const TRAVEL_DAYS = {
  '2026-04-02': 1.3, // Maundy Thursday - getaway
  '2026-04-03': 1.38, // Good Friday - the hardest day of the year
  '2026-04-06': 1.26, // Easter Monday - return
  '2026-05-14': 1.16, // Ascension
  '2026-05-22': 1.14, // Whitsun getaway
  '2026-07-31': 1.18, // start of the Bavarian summer holidays
  '2026-08-07': 1.14,
  '2026-10-30': 1.13, // autumn half-term
  '2026-12-23': 1.2, // Christmas getaway
}

// ---------------------------------------------------------- profile shaping
/**
 * Raw (unscaled) site load shape.
 * `w` weights the broad evening plateau, `v` the day-to-day spread
 * (a few very busy days carry most of the curtailment energy).
 */
function rawProfile(w, v) {
  const rnd = mulberry32(SEED)
  const raw = new Float64Array(N)

  for (let d = 0; d < DAYS; d++) {
    const wd = weekdayOf(d)
    const isSat = wd === 6
    const isSun = wd === 0
    const isWeekend = isSat || isSun
    const date = iso(d)

    // Winter peaks higher: colder batteries, more preconditioning, longer dwell.
    const seasonal = 1 + 0.17 * Math.cos((2 * Math.PI * (d - 14)) / DAYS)
    const weekly = isSun ? 0.78 : isSat ? 0.9 : 1
    const travel = TRAVEL_DAYS[date] ?? 1
    // A slow drift: the park fills up over its first year.
    const rampUp = 0.9 + (0.2 * d) / DAYS
    // Skewed day-level draw: most days ordinary, a handful genuinely busy.
    const busy = 1 + v * rnd() ** 2.4
    const dayFactor = seasonal * weekly * travel * rampUp * busy

    for (let s = 0; s < STEPS_PER_DAY; s++) {
      const h = s / 4

      const base = isWeekend
        ? 0.2 +
          gauss(h, 10.5, 2.2, 0.62) +
          gauss(h, 14.5, 2.4, 0.8) +
          gauss(h, 18.5, 2.0, 0.55)
        : 0.22 +
          gauss(h, 7.5, 1.6, 0.55) +
          gauss(h, 12.5, 2.0, 0.7) +
          gauss(h, 17.8, 1.7, 0.92) +
          gauss(h, 21.5, 1.6, 0.42)

      // A broad plateau, not a spike: busy days sit near their peak for hours,
      // which is what makes the energy at risk - not just the hours - add up.
      const plateau = isWeekend ? gauss(h, 14.0, 2.6, 1) : gauss(h, 18.0, 2.3, 1)

      const noise = 1 + 0.07 * (rnd() * 2 - 1)
      raw[d * STEPS_PER_DAY + s] = Math.max(0, base * (1 + w * plateau) * dayFactor * noise)
    }
  }
  return raw
}

/** Scale a raw shape so the peak is exactly PEAK_MW and the mean hits MEAN_MW. */
function scaleProfile(raw) {
  let max = 0
  for (let i = 0; i < N; i++) if (raw[i] > max) max = raw[i]

  const meanAt = (gamma) => {
    let sum = 0
    for (let i = 0; i < N; i++) sum += PEAK_MW * (raw[i] / max) ** gamma
    return sum / N
  }

  // Higher gamma pushes the shape down towards the peak -> lower mean.
  let lo = 0.2
  let hi = 6
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2
    if (meanAt(mid) > MEAN_MW) lo = mid
    else hi = mid
  }
  const gamma = (lo + hi) / 2

  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) out[i] = PEAK_MW * (raw[i] / max) ** gamma
  return { profile: out, gamma }
}

/** Hours above the cap and energy above the cap, for any per-step cap series. */
function curtailment(profile, capAt) {
  let hours = 0
  let energy = 0
  for (let i = 0; i < N; i++) {
    const cap = capAt(i)
    if (profile[i] > cap) {
      hours += H
      energy += (profile[i] - cap) * H
    }
  }
  return { hours, energy }
}

// ------------------------------------- calibrate the shape (plateau + spread)
let best = null
for (let wi = 0; wi <= 28; wi++) {
  const w = 0.15 + wi * 0.05
  for (let vi = 0; vi <= 30; vi++) {
    const v = vi * 0.2
    const { profile, gamma } = scaleProfile(rawProfile(w, v))
    const { hours, energy } = curtailment(profile, () => 3.5)
    const score =
      Math.abs(hours - TARGET.staticHours) / TARGET.staticHours +
      Math.abs(energy - TARGET.staticEnergy) / TARGET.staticEnergy
    if (!best || score < best.score) best = { w, v, gamma, profile, score }
  }
}
const { profile, gamma: GAMMA } = best

let peak = 0
let total = 0
for (let i = 0; i < N; i++) {
  if (profile[i] > peak) peak = profile[i]
  total += profile[i] * H
}
const meanMw = total / (N * H)

// ------------------------------------- option A: static cap, 3.5 MW all year
const STATIC_CAP_MW = 3.5
const staticResult = curtailment(profile, () => STATIC_CAP_MW)

// --------------------------- option B: dynamic seasonal time-of-day cap table
// Season index: 0 winter (Dec-Feb), 1 spring, 2 summer, 3 autumn.
const seasonOf = (dayOfYear) => {
  const m = new Date(Date.UTC(YEAR, 0, 1 + dayOfYear)).getUTCMonth()
  if (m === 11 || m <= 1) return 0
  if (m <= 4) return 1
  if (m <= 7) return 2
  return 3
}
const SEASON_NAMES = ['Winter', 'Spring', 'Summer', 'Autumn']

const TOD_MIN_MW = 3.0

/**
 * How stressed the operator's network is, 0 (quiet night) to 1 (winter evening).
 * The cap is derived from it, so the table always spans exactly 3.0 - 6.0 MW.
 */
function stressAt(season, hour) {
  // Winter evenings are the only hours that reach the 3.0 MW floor.
  const byHour =
    hour >= 18 && hour < 20
      ? 1.0
      : hour === 17 || hour === 20
        ? 0.82
        : hour === 16 || hour === 21
          ? 0.62
          : hour >= 11 && hour < 16
            ? 0.5
            : hour >= 7 && hour < 11
              ? 0.4
              : hour === 22
                ? 0.38
                : 0
  const bySeason = [1.0, 0.7, 0.55, 0.82][season]
  return byHour * bySeason
}

/** `p` tunes tightness: small p pulls more hours down towards the 3.0 MW floor. */
function todTable(p) {
  const table = []
  for (let season = 0; season < 4; season++) {
    const row = []
    for (let h = 0; h < 24; h++) {
      const stress = stressAt(season, h)
      const cap = CONNECTION_MW - (CONNECTION_MW - TOD_MIN_MW) * (stress === 0 ? 0 : stress ** p)
      row.push(round(cap, 1))
    }
    table.push(row)
  }
  return table
}

let bestTod = null
for (let step = 0; step <= 120; step++) {
  const p = 0.3 + step * 0.08
  const table = todTable(p)
  const res = curtailment(profile, (i) => {
    const d = Math.floor(i / STEPS_PER_DAY)
    return table[seasonOf(d)][Math.floor((i % STEPS_PER_DAY) / 4)]
  })
  const score =
    Math.abs(res.hours - TARGET.dynamicHours) / TARGET.dynamicHours +
    Math.abs(res.energy - TARGET.dynamicEnergy) / TARGET.dynamicEnergy
  if (!bestTod || score < bestTod.score) bestTod = { p, table, ...res, score }
}
const TOD_TABLE = bestTod.table
const dynamicResult = { hours: bestTod.hours, energy: bestTod.energy }
let todMin = 6
let todMax = 0
for (const row of TOD_TABLE)
  for (const c of row) {
    todMin = Math.min(todMin, c)
    todMax = Math.max(todMax, c)
  }

// ------------------------------ option C: fully dynamic day-ahead limit feed
// The DSO constrains the days when its own network is stressed, which are the
// days this site peaks hardest. Three days are fixed by the demo script.
const SCRIPTED = {
  '2026-01-20': { windows: [{ startHour: 17, endHour: 20, limitMw: 2.5 }], reason: 'Cold snap - evening peak on the feeder' },
  // The day's peak is at 17:30, so the window sits 16-20 h: an 11-15 h window
  // would be entirely above the load and the battery would never move.
  '2026-04-03': { windows: [{ startHour: 16, endHour: 20, limitMw: 4.0 }], reason: 'Easter travel peak - regional transfer limit' },
  '2026-06-19': { windows: [], reason: 'High solar infeed - no limit' },
}
const SCRIPTED_DAYS = Object.keys(SCRIPTED)

const dayPeaks = []
for (let d = 0; d < DAYS; d++) {
  let p = 0
  let arg = 0
  for (let s = 0; s < STEPS_PER_DAY; s++) {
    const v = profile[d * STEPS_PER_DAY + s]
    if (v > p) {
      p = v
      arg = s
    }
  }
  dayPeaks.push({ day: d, date: iso(d), peak: p, peakHour: Math.floor(arg / 4) })
}
const ranked = [...dayPeaks].sort((a, b) => b.peak - a.peak)

function buildDayAhead(count, drop) {
  const byDate = new Map()
  for (const [date, spec] of Object.entries(SCRIPTED)) byDate.set(date, spec)

  for (const day of ranked) {
    if (byDate.size >= count) break
    if (byDate.has(day.date)) continue
    const limit = Math.min(
      CONNECTION_MW,
      Math.max(GUARANTEED_MIN_MW, round(day.peak - drop, 1)),
    )
    const startHour = Math.max(0, Math.min(20, day.peakHour - 1))
    byDate.set(day.date, {
      windows: [{ startHour, endHour: Math.min(24, startHour + 4), limitMw: limit }],
      reason: seasonOf(day.day) === 2 ? 'Planned works on the 110 kV feeder' : 'Forecast network congestion',
    })
  }
  return byDate
}

function dayAheadCapSeries(byDate) {
  const caps = new Float64Array(N).fill(CONNECTION_MW)
  for (const [date, spec] of byDate) {
    const d = Math.round(
      (Date.parse(`${date}T00:00:00Z`) - Date.UTC(YEAR, 0, 1)) / 86400000,
    )
    for (const win of spec.windows)
      for (let s = win.startHour * 4; s < win.endHour * 4; s++)
        caps[d * STEPS_PER_DAY + s] = win.limitMw
  }
  return caps
}

let bestDa = null
for (let count = 20; count <= 70; count += 1) {
  for (let step = 0; step <= 24; step++) {
    const drop = 0.4 + step * 0.05
    const byDate = buildDayAhead(count, drop)
    const caps = dayAheadCapSeries(byDate)
    const res = curtailment(profile, (i) => caps[i])
    const score =
      Math.abs(res.hours - TARGET.dayAheadHours) / TARGET.dayAheadHours +
      Math.abs(res.energy - TARGET.dayAheadEnergy) / TARGET.dayAheadEnergy
    if (!bestDa || score < bestDa.score) bestDa = { count, drop, byDate, ...res, score }
  }
}
const dayAheadResult = { hours: bestDa.hours, energy: bestDa.energy }

let daMin = CONNECTION_MW
for (const spec of bestDa.byDate.values())
  for (const win of spec.windows) daMin = Math.min(daMin, win.limitMw)

// ------------------------------------------------------------------ outputs
const annualMwh = total
const cost = (energy) => Math.round(energy * MARGIN_EUR_PER_MWH)
const pct = (energy) => (energy / annualMwh) * 100

mkdirSync(OUT, { recursive: true })

writeFileSync(
  join(OUT, 'profile.json'),
  JSON.stringify({
    meta: {
      site: 'Autohof Hallertau',
      description:
        'Fictional truck and car HPC charging park on the A9 in Bavaria. Seeded simulation.',
      label: 'Simulation',
      year: YEAR,
      start: `${YEAR}-01-01T00:00:00Z`,
      intervalMinutes: 15,
      count: N,
      unit: 'MW',
      connectionMw: CONNECTION_MW,
      batteryPowerMw: 2,
      batteryEnergyMwh: 4,
      peakMw: round(peak, 2),
      meanMw: round(meanMw, 2),
      annualMwh: Math.round(annualMwh),
      annualGwh: round(annualMwh / 1000, 2),
      marginEurPerMwh: MARGIN_EUR_PER_MWH,
    },
    values: Array.from(profile, (v) => round(v, 3)),
  }),
)

writeFileSync(
  join(OUT, 'limits.json'),
  JSON.stringify(
    {
      meta: {
        operator: 'Demo DSO',
        label: 'Simulation',
        year: YEAR,
        defaultLimitMw: CONNECTION_MW,
        guaranteedMinimumMw: GUARANTEED_MIN_MW,
        noticePeriod: 'day-ahead',
        constrainedDays: bestDa.byDate.size,
        scriptedDays: SCRIPTED_DAYS,
        timeOfDay: {
          description:
            'Dynamic option: seasonal time-of-day cap table, MW by season and hour of day.',
          seasons: SEASON_NAMES,
          minMw: round(todMin, 1),
          maxMw: round(todMax, 1),
          table: TOD_TABLE,
        },
        staticCapMw: STATIC_CAP_MW,
      },
      days: dayPeaks.map(({ date }) => {
        const spec = bestDa.byDate.get(date)
        return {
          date,
          windows: spec ? spec.windows : [],
          reason: spec ? spec.reason : 'No limit issued',
        }
      }),
    },
    null,
    0,
  ),
)

// Proxy headroom score per federal state. Illustrative, not measured.
const REGIONS = [
  ['BY', 'Bavaria', 87, 11.4, 48.9],
  ['BW', 'Baden-Wuerttemberg', 71, 9.1, 48.6],
  ['HE', 'Hesse', 63, 9.0, 50.6],
  ['RP', 'Rhineland-Palatinate', 68, 7.4, 49.9],
  ['SL', 'Saarland', 55, 6.9, 49.4],
  ['NW', 'North Rhine-Westphalia', 41, 7.4, 51.4],
  ['NI', 'Lower Saxony', 58, 9.2, 52.8],
  ['SH', 'Schleswig-Holstein', 44, 9.7, 54.2],
  ['HH', 'Hamburg', 33, 10.0, 53.6],
  ['HB', 'Bremen', 36, 8.8, 53.1],
  ['MV', 'Mecklenburg-Vorpommern', 49, 12.4, 53.7],
  ['BB', 'Brandenburg', 52, 13.3, 52.4],
  ['BE', 'Berlin', 29, 13.4, 52.5],
  ['ST', 'Saxony-Anhalt', 57, 11.7, 51.9],
  ['TH', 'Thuringia', 61, 11.0, 50.9],
  ['SN', 'Saxony', 54, 13.4, 51.0],
]

writeFileSync(
  join(OUT, 'regions.json'),
  JSON.stringify(
    {
      meta: {
        label: 'Proxy estimate',
        note: 'Illustrative proxy headroom score per German federal state. Not measured capacity.',
        scale: '0 = no headroom, 100 = most headroom',
        year: YEAR,
      },
      site: {
        name: 'Autohof Hallertau',
        state: 'BY',
        stateName: 'Bavaria',
        motorway: 'A9',
        lon: 11.7,
        lat: 48.6,
        requestedMw: CONNECTION_MW,
      },
      regions: REGIONS.map(([code, name, score, lon, lat]) => ({
        code,
        name,
        headroomScore: score,
        lon,
        lat,
      })),
    },
    null,
    2,
  ),
)

// ------------------------------------------------------------------ report
const report = {
  calibration: { plateau: round(best.w, 3), spread: round(best.v, 3), gamma: round(GAMMA, 4) },
  profile: {
    peakMw: round(peak, 2),
    meanMw: round(meanMw, 2),
    annualGwh: round(annualMwh / 1000, 2),
  },
  options: [
    {
      id: 'static',
      capMw: STATIC_CAP_MW,
      hours: Math.round(staticResult.hours),
      mwh: Math.round(staticResult.energy),
      pct: round(pct(staticResult.energy), 1),
      costEur: cost(staticResult.energy),
    },
    {
      id: 'dynamic',
      capMw: `${round(todMin, 1)}-${round(todMax, 1)}`,
      hours: Math.round(dynamicResult.hours),
      mwh: Math.round(dynamicResult.energy),
      pct: round(pct(dynamicResult.energy), 1),
      costEur: cost(dynamicResult.energy),
    },
    {
      id: 'dayAhead',
      capMw: `${round(daMin, 1)}-${CONNECTION_MW.toFixed(1)}`,
      hours: Math.round(dayAheadResult.hours),
      mwh: Math.round(dayAheadResult.energy),
      pct: round(pct(dayAheadResult.energy), 1),
      costEur: cost(dayAheadResult.energy),
      constrainedDays: bestDa.byDate.size,
    },
  ],
  yearOneRevenueEurM: round((annualMwh * MARGIN_EUR_PER_MWH) / 1e6, 2),
}
console.log(JSON.stringify(report, null, 2))
