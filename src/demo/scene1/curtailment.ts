import type { Limits, Profile } from '../../data'
import type { Operator } from './operators'

/**
 * What an operator's regime would cost this site over the analysed year.
 *
 * The thing this exists to get right is that a cap is not a number, it is a
 * shape. Modelling every operator as a flat annual ceiling was wrong twice
 * over: it reported nought hours for a fully dynamic operator whose ceiling is
 * the full connection - correct for a flat reading and useless as an answer -
 * and it let the term sheet state a ceiling in one clause and annex the
 * consequences of an entirely different one two rows below.
 *
 *   static        a single level, all year. The ceiling is the cap.
 *   dynamic       a seasonal time-of-day table, scaled to this operator's cap.
 *   fullyDynamic  day-ahead windows on the days congestion is forecast, scaled
 *                 to this operator's cap; full capacity the rest of the year.
 *
 * Scaling rather than re-deriving keeps one shape per limitation type and moves
 * it up or down with the operator's own ceiling, so two operators writing the
 * same type differ by exactly the term they negotiated.
 */

export interface Curtailment {
  /** Hours in the year the site would have wanted more than the regime allows. */
  hours: number
  /** Energy above the limit, MWh. */
  energyMwh: number
  /** That energy as a share of annual consumption, percent. */
  sharePct: number
  /** Gross margin lost on it at the assumed margin, euros. */
  costEur: number
  /** Longest unbroken run above the limit, hours. */
  longestRunHours: number
}

const STEPS_PER_DAY = 96
const HOURS_PER_STEP = 0.25

/**
 * Season row of the time-of-day table: 0 winter (Dec-Feb), 1 spring, 2 summer,
 * 3 autumn.
 *
 * DUPLICATED from `seasonOf` in scripts/generate-data.mjs, which built the table
 * this indexes into. limits.json ships the table and the season names but not
 * the day-to-season mapping, so it has to be re-derived here. If the
 * generator's boundaries move, change both.
 */
function seasonOf(dayOfYear: number, year: number): number {
  const m = new Date(Date.UTC(year, 0, 1 + dayOfYear)).getUTCMonth()
  if (m === 11 || m <= 1) return 0
  if (m <= 4) return 1
  if (m <= 7) return 2
  return 3
}

/** The limit in force at each of the year's 35,040 quarter-hours, MW. */
export function limitSeries(operator: Operator, limits: Limits, year: number): Float64Array {
  const total = STEPS_PER_DAY * limits.days.length
  const out = new Float64Array(total)

  if (!operator.offersFca) {
    out.fill(operator.capMw)
    return out
  }

  if (operator.limitType === 'static') {
    out.fill(operator.capMw)
    return out
  }

  const { defaultLimitMw, timeOfDay } = limits.meta

  if (operator.limitType === 'dynamic') {
    // The table runs minMw..maxMw; move the whole shape so its top is this
    // operator's ceiling rather than the reference one.
    const scale = operator.capMw / timeOfDay.maxMw
    for (let i = 0; i < total; i++) {
      const day = Math.floor(i / STEPS_PER_DAY)
      const hour = Math.floor((i % STEPS_PER_DAY) / 4)
      out[i] = timeOfDay.table[seasonOf(day, year)][hour] * scale
    }
    return out
  }

  // fullyDynamic: full capacity except on the days a limit is announced.
  const scale = operator.capMw / defaultLimitMw
  for (let d = 0; d < limits.days.length; d++) {
    const base = d * STEPS_PER_DAY
    for (let s = 0; s < STEPS_PER_DAY; s++) out[base + s] = operator.capMw
    for (const w of limits.days[d].windows)
      for (let s = w.startHour * 4; s < w.endHour * 4; s++) out[base + s] = w.limitMw * scale
  }
  return out
}

export function curtailmentOf(
  operator: Operator,
  profile: Profile,
  limits: Limits,
  year: number,
): Curtailment {
  const limit = limitSeries(operator, limits, year)
  const n = Math.min(profile.values.length, limit.length)

  let hours = 0
  let energyMwh = 0
  let run = 0
  let longestRun = 0

  for (let i = 0; i < n; i++) {
    const over = profile.values[i] - limit[i]
    if (over > 1e-9) {
      hours += HOURS_PER_STEP
      energyMwh += over * HOURS_PER_STEP
      run++
      if (run > longestRun) longestRun = run
    } else run = 0
  }

  return {
    hours,
    energyMwh,
    sharePct: (energyMwh / profile.meta.annualMwh) * 100,
    costEur: energyMwh * profile.meta.marginEurPerMwh,
    longestRunHours: longestRun * HOURS_PER_STEP,
  }
}
