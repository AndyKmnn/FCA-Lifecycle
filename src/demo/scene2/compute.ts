import type { Limits, Profile } from '../../data'
import { HOURS_PER_STEP, STEPS_PER_DAY } from '../../data'

/** Hours above the cap and the energy that would be cut, for one cap rule. */
export interface Curtailment {
  /** Hours in the year when the load exceeds the cap. */
  hours: number
  /** Energy above the cap, MWh. */
  energyMwh: number
  /** That energy as a share of the site's annual consumption, percent. */
  sharePct: number
  /** Gross margin lost on it, euros, at the assumed margin. */
  costEur: number
}

function curtailment(profile: Profile, capAt: (i: number) => number): Curtailment {
  const { values, meta } = profile
  let hours = 0
  let energyMwh = 0
  for (let i = 0; i < values.length; i++) {
    const cap = capAt(i)
    if (values[i] > cap) {
      hours += HOURS_PER_STEP
      energyMwh += (values[i] - cap) * HOURS_PER_STEP
    }
  }
  return {
    hours,
    energyMwh,
    sharePct: (energyMwh / meta.annualMwh) * 100,
    costEur: energyMwh * meta.marginEurPerMwh,
  }
}

/** Season row of the time-of-day table: 0 winter (Dec-Feb), 1 spring, 2 summer, 3 autumn. */
function seasonOf(dayOfYear: number, year: number): number {
  const m = new Date(Date.UTC(year, 0, 1 + dayOfYear)).getUTCMonth()
  if (m === 11 || m <= 1) return 0
  if (m <= 4) return 1
  if (m <= 7) return 2
  return 3
}

export interface FcaOption {
  id: 'static' | 'dynamic' | 'fullyDynamic'
  title: string
  /** The cap rule, in words. */
  rule: string
  /** One extra fact about the rule, from the data. */
  note: string
  recommended: boolean
  result: Curtailment
}

/**
 * The three FCA limitation types from docs/PRODUCT.md, each scored against the
 * site's real 15-minute profile. Everything here is computed in the browser.
 */
export function buildOptions(profile: Profile, limits: Limits): FcaOption[] {
  const { staticCapMw, timeOfDay, defaultLimitMw, constrainedDays } = limits.meta

  const dayCaps = limits.days.map((day) => {
    const series = new Array<number>(STEPS_PER_DAY).fill(defaultLimitMw)
    for (const w of day.windows)
      for (let s = w.startHour * 4; s < w.endHour * 4; s++) series[s] = w.limitMw
    return series
  })

  let dayAheadMin = defaultLimitMw
  for (const day of limits.days)
    for (const w of day.windows) dayAheadMin = Math.min(dayAheadMin, w.limitMw)

  return [
    {
      id: 'static',
      title: 'Static',
      rule: `Fixed cap ${staticCapMw.toFixed(1)} MW, all year`,
      note: 'One number in the contract, every hour of the year.',
      recommended: false,
      result: curtailment(profile, () => staticCapMw),
    },
    {
      id: 'dynamic',
      title: 'Dynamic',
      rule: `Seasonal time-of-day cap ${timeOfDay.minMw.toFixed(1)}-${timeOfDay.maxMw.toFixed(1)} MW`,
      note: 'A cap table agreed up front, by season and hour of day.',
      recommended: false,
      result: curtailment(profile, (i) =>
        timeOfDay.table[seasonOf(Math.floor(i / STEPS_PER_DAY), profile.meta.year)][
          Math.floor((i % STEPS_PER_DAY) / 4)
        ],
      ),
    },
    {
      id: 'fullyDynamic',
      title: 'Fully dynamic',
      rule: `Day-ahead limits ${dayAheadMin.toFixed(1)}-${defaultLimitMw.toFixed(1)} MW`,
      note: `The feed constrains ${constrainedDays} of ${limits.days.length} days; on every other day the limit is the full ${defaultLimitMw} MW.`,
      recommended: true,
      result: curtailment(profile, (i) => dayCaps[Math.floor(i / STEPS_PER_DAY)][i % STEPS_PER_DAY]),
    },
  ]
}

export interface LdcPoint {
  /** Share of the year at or above this load, percent. */
  pct: number
  mw: number
}

/** Load-duration curve: the year's 15-minute values sorted from highest to lowest. */
export function loadDurationCurve(profile: Profile, points = 400): LdcPoint[] {
  const sorted = [...profile.values].sort((a, b) => b - a)
  const last = sorted.length - 1
  const out: LdcPoint[] = []
  for (let k = 0; k < points; k++) {
    const i = Math.round((k / (points - 1)) * last)
    out.push({ pct: (i / last) * 100, mw: sorted[i] })
  }
  return out
}
