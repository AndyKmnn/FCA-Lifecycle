/**
 * Scene 3 - the autopilot re-planner.
 *
 * Pure, deterministic and side-effect free: the same profile.json and limits.json
 * always produce the same year. The whole year is planned once when the scene
 * mounts (35,040 quarter-hour steps, a few milliseconds) and the replay then just
 * animates the result, so nothing is computed inside the animation frame.
 *
 * The rule is deliberately simple and greedy, one step at a time:
 *   1. If the requested load is above the day-ahead cap, discharge the battery.
 *   2. If that is not enough, slow the charging sessions - by at most
 *      MAX_SLOWDOWN of the requested load. No vehicle is turned away; the
 *      energy is delivered a little later.
 *   3. Otherwise the step is a breach, and it is reported rather than hidden.
 * Outside a cap the battery buys cheaply in the midday solar hours and serves the
 * evening peak, except when a limit is announced for today or tomorrow - then it
 * is held in reserve and charged to full.
 */
import type { Limits, Profile } from '../../data'

export const STEPS_PER_DAY = 96
export const HOURS_PER_STEP = 0.25
export const DAYS_PER_YEAR = 365

/** Charging sessions may be slowed by at most this share of requested load. */
export const MAX_SLOWDOWN = 0.1

/** Cheap hours: midday solar. The battery buys here. */
const CHEAP_FROM_HOUR = 10
const CHEAP_TO_HOUR = 16
/** The evening peak the battery serves when it is not held in reserve. */
const PEAK_FROM_HOUR = 17
const PEAK_TO_HOUR = 21

/** Power is MW, energy MWh, state of charge MWh. One step is 15 minutes. */
export interface DayPlan {
  dayOfYear: number
  /** YYYY-MM-DD */
  date: string
  /** Sat or Sun. */
  weekend: boolean
  constrained: boolean
  reason: string
  windows: Limits['days'][number]['windows']
  /** The lowest cap of the day, MW. */
  capMinMw: number
  /** First step of the first cap window, or -1 on an unconstrained day. */
  firstCapStep: number
  requested: number[]
  cap: number[]
  /** What the vehicles get: requested minus the slowdown. */
  delivered: number[]
  /** What crosses the meter: delivered, minus discharge, plus charging. */
  grid: number[]
  /** Signed battery power: positive discharging, negative charging. */
  battery: number[]
  /** State of charge in MWh at the end of each step. */
  soc: number[]
  slowedMwh: number
  dischargedMwh: number
  chargedMwh: number
  servedMwh: number
  peakGridMw: number
  breachSteps: number
  /** Largest amount by which the grid draw exceeded the cap, MW. */
  worstOvershootMw: number
}

export interface InfeasibleDay {
  date: string
  dayOfYear: number
  /** Energy above the cap that had to be removed, MWh. */
  energyAboveCapMwh: number
  /** What the battery could give, MWh. */
  batteryMwh: number
  /** What a MAX_SLOWDOWN slowdown could give, MWh. */
  slowdownMwh: number
  /** The shortfall, MWh. */
  deficitMwh: number
  /** The slowdown share that would have been needed instead of MAX_SLOWDOWN. */
  neededSlowdown: number
  worstOvershootMw: number
}

export interface YearPlan {
  days: DayPlan[]
  constrainedDays: number[]
  /** Gross margin per MWh sold, from profile.json - what the revenue counter uses. */
  marginEurPerMwh: number
  totals: {
    requestedMwh: number
    servedMwh: number
    slowedMwh: number
    dischargedMwh: number
    breachSteps: number
    breachDays: number
    revenueEur: number
  }
  /** Running revenue in euros at the end of each day. */
  revenueByDay: number[]
  /** Running breach count at the end of each day. */
  breachesByDay: number[]
  feasible: boolean
  infeasible: InfeasibleDay[]
}

const hourOf = (step: number) => Math.floor(step / 4)

/** The 96 quarter-hour caps for one day, in MW. */
function capsForDay(limits: Limits, day: number): number[] {
  const caps = new Array<number>(STEPS_PER_DAY).fill(limits.meta.defaultLimitMw)
  for (const win of limits.days[day].windows)
    for (let s = win.startHour * 4; s < win.endHour * 4; s++) caps[s] = win.limitMw
  return caps
}

/**
 * Plans the whole year. `profile.values` is the requested load the customer would
 * draw with no limit at all; the plan is what the site actually does instead.
 */
export function planYear(profile: Profile, limits: Limits): YearPlan {
  const battPowerMw = profile.meta.batteryPowerMw
  const battEnergyMwh = profile.meta.batteryEnergyMwh
  const margin = profile.meta.marginEurPerMwh

  const constrained = limits.days.map((d) => d.windows.length > 0)

  const days: DayPlan[] = []
  const revenueByDay: number[] = []
  const breachesByDay: number[] = []
  const infeasible: InfeasibleDay[] = []

  let soc = battEnergyMwh
  let runRequested = 0
  let runServed = 0
  let runSlowed = 0
  let runDischarged = 0
  let runBreaches = 0
  let breachDays = 0

  for (let d = 0; d < DAYS_PER_YEAR; d++) {
    const cap = capsForDay(limits, d)
    const requested = profile.values.slice(d * STEPS_PER_DAY, (d + 1) * STEPS_PER_DAY)
    // A limit is announced day-ahead, so the evening before counts as reserved too.
    const reserved = constrained[d] || (d + 1 < DAYS_PER_YEAR && constrained[d + 1])

    const delivered = new Array<number>(STEPS_PER_DAY)
    const grid = new Array<number>(STEPS_PER_DAY)
    const battery = new Array<number>(STEPS_PER_DAY)
    const socSeries = new Array<number>(STEPS_PER_DAY)

    let slowedMwh = 0
    let dischargedMwh = 0
    let chargedMwh = 0
    let servedMwh = 0
    let peakGridMw = 0
    let breachSteps = 0
    let worstOvershootMw = 0
    let energyAboveCapMwh = 0
    let slowdownRoomMwh = 0

    for (let s = 0; s < STEPS_PER_DAY; s++) {
      const load = requested[s]
      const limit = cap[s]
      const capped = limit < limits.meta.defaultLimitMw
      const hour = hourOf(s)

      let discharge = 0
      let slowed = 0
      let charge = 0

      if (load > limit + 1e-9) {
        // --- the re-plan: battery first, then slow the sessions a little.
        const excess = load - limit
        energyAboveCapMwh += excess * HOURS_PER_STEP
        slowdownRoomMwh += MAX_SLOWDOWN * load * HOURS_PER_STEP
        discharge = Math.min(battPowerMw, soc / HOURS_PER_STEP, excess)
        slowed = Math.min(MAX_SLOWDOWN * load, excess - discharge)
      } else if (!capped) {
        // --- no cap in force: buy cheaply, or hold full if a limit is coming.
        const headroom = limit - load
        const wantCharge = reserved
          ? soc < battEnergyMwh
          : hour >= CHEAP_FROM_HOUR && hour < CHEAP_TO_HOUR
        const wantDischarge =
          !reserved && hour >= PEAK_FROM_HOUR && hour < PEAK_TO_HOUR && soc > 0
        if (wantCharge)
          charge = Math.min(battPowerMw, (battEnergyMwh - soc) / HOURS_PER_STEP, headroom)
        else if (wantDischarge) discharge = Math.min(battPowerMw, soc / HOURS_PER_STEP, load)
      }

      soc = Math.min(battEnergyMwh, Math.max(0, soc + (charge - discharge) * HOURS_PER_STEP))

      const deliveredMw = load - slowed
      const gridMw = deliveredMw - discharge + charge

      delivered[s] = deliveredMw
      grid[s] = gridMw
      battery[s] = discharge - charge
      socSeries[s] = soc

      if (gridMw > limit + 1e-6) {
        breachSteps++
        worstOvershootMw = Math.max(worstOvershootMw, gridMw - limit)
      }
      peakGridMw = Math.max(peakGridMw, gridMw)
      slowedMwh += slowed * HOURS_PER_STEP
      dischargedMwh += discharge * HOURS_PER_STEP
      chargedMwh += charge * HOURS_PER_STEP
      servedMwh += deliveredMw * HOURS_PER_STEP
    }

    const windows = limits.days[d].windows
    const firstCapStep = windows.length > 0 ? windows[0].startHour * 4 : -1
    const weekdayIndex = new Date(Date.UTC(limits.meta.year, 0, 1 + d)).getUTCDay()

    days.push({
      dayOfYear: d,
      date: limits.days[d].date,
      weekend: weekdayIndex === 0 || weekdayIndex === 6,
      constrained: constrained[d],
      reason: limits.days[d].reason,
      windows,
      capMinMw: Math.min(...cap),
      firstCapStep,
      requested,
      cap,
      delivered,
      grid,
      battery,
      soc: socSeries,
      slowedMwh,
      dischargedMwh,
      chargedMwh,
      servedMwh,
      peakGridMw,
      breachSteps,
      worstOvershootMw,
    })

    if (breachSteps > 0) {
      breachDays++
      infeasible.push({
        date: limits.days[d].date,
        dayOfYear: d,
        energyAboveCapMwh,
        batteryMwh: dischargedMwh,
        slowdownMwh: slowdownRoomMwh,
        deficitMwh: energyAboveCapMwh - dischargedMwh - slowdownRoomMwh,
        neededSlowdown:
          slowdownRoomMwh > 0
            ? ((energyAboveCapMwh - dischargedMwh) / slowdownRoomMwh) * MAX_SLOWDOWN
            : Number.POSITIVE_INFINITY,
        worstOvershootMw,
      })
    }

    runRequested += requested.reduce((a, b) => a + b, 0) * HOURS_PER_STEP
    runServed += servedMwh
    runSlowed += slowedMwh
    runDischarged += dischargedMwh
    runBreaches += breachSteps
    revenueByDay.push(runServed * margin)
    breachesByDay.push(runBreaches)
  }

  return {
    days,
    constrainedDays: days.filter((d) => d.constrained).map((d) => d.dayOfYear),
    marginEurPerMwh: margin,
    totals: {
      requestedMwh: runRequested,
      servedMwh: runServed,
      slowedMwh: runSlowed,
      dischargedMwh: runDischarged,
      breachSteps: runBreaches,
      breachDays,
      revenueEur: runServed * margin,
    },
    revenueByDay,
    breachesByDay,
    feasible: runBreaches === 0,
    infeasible,
  }
}
