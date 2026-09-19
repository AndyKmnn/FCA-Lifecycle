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

/**
 * Season row of the time-of-day table: 0 winter (Dec-Feb), 1 spring, 2 summer,
 * 3 autumn.
 *
 * DUPLICATED from `seasonOf` in scripts/generate-data.mjs, which built the cap
 * table this indexes into. limits.json ships the table and the season names but
 * not the day-to-season mapping, so the browser has to re-derive it. If the
 * generator's season boundaries ever move, change both or the dynamic option
 * silently stops matching docs/DEMO_SCRIPT.md.
 */
function seasonOf(dayOfYear: number, year: number): number {
  const m = new Date(Date.UTC(year, 0, 1 + dayOfYear)).getUTCMonth()
  if (m === 11 || m <= 1) return 0
  if (m <= 4) return 1
  if (m <= 7) return 2
  return 3
}

/** Curtailment for one of the three limitation types, against the real profile. */
export function curtailmentFor(
  profile: Profile,
  limits: Limits,
  type: 'static' | 'dynamic' | 'fullyDynamic',
): Curtailment {
  const { staticCapMw, timeOfDay, defaultLimitMw } = limits.meta
  if (type === 'static') return curtailment(profile, () => staticCapMw)
  if (type === 'dynamic')
    return curtailment(profile, (i) =>
      timeOfDay.table[seasonOf(Math.floor(i / STEPS_PER_DAY), profile.meta.year)][
        Math.floor((i % STEPS_PER_DAY) / 4)
      ],
    )
  const dayCaps = limits.days.map((day) => {
    const series = new Array<number>(STEPS_PER_DAY).fill(defaultLimitMw)
    for (const w of day.windows)
      for (let s = w.startHour * 4; s < w.endHour * 4; s++) series[s] = w.limitMw
    return series
  })
  return curtailment(profile, (i) => dayCaps[Math.floor(i / STEPS_PER_DAY)][i % STEPS_PER_DAY])
}
