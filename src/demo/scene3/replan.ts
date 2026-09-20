/**
 * Scene 3 - the autopilot re-planner.
 *
 * Pure, deterministic and side-effect free: the same profile.json and limits.json
 * always produce the same year. The whole year is planned once when the scene
 * mounts (35,040 quarter-hour steps, a few milliseconds), and again whenever the
 * presenter releases a cap they have dragged.
 *
 * planDay() plans one day and is the unit both paths use: planYear() walks the
 * year calling it and carrying the state of charge forward, while replanDay()
 * calls it for the single day under the cursor during a drag.
 *
 * The rule, one step at a time:
 *   1. If the requested load is above the day-ahead cap, slow the charging
 *      sessions - by the share this day actually needs, which slowdownForDay
 *      works out up front and is zero on all but one day of the year.
 *   2. Discharge the battery for whatever excess is left. Taking the slowdown
 *      first is what rations the battery across a long window; discharging
 *      greedily runs it flat early and breaches the tail.
 *   3. If the battery still cannot cover the step, fall back to the full
 *      MAX_SLOWDOWN before giving up. No vehicle is turned away; the energy is
 *      delivered a little later.
 *   4. Otherwise the step is a breach, and it is reported rather than hidden.
 * Outside a cap the battery buys cheaply in the midday solar hours and serves the
 * evening peak, except when a limit is announced for today or tomorrow - then it
 * is held in reserve and charged to full.
 */
import type { Limits, LimitWindow, Profile } from '../../data'

export const STEPS_PER_DAY = 96
export const HOURS_PER_STEP = 0.25
export const DAYS_PER_YEAR = 365

/**
 * Charging sessions may be slowed by at most this share of requested load.
 *
 * One day in the year sets this floor: 2026-01-20, the cold January evening,
 * needs 5.70 MWh held back under a 2.5 MW cap. A full 4 MWh battery cannot do
 * it alone - and its 2 MW of power is under the 2.27 MW peak excess - so the
 * remainder has to come off the sessions, which takes 12.9%. At 0.1 the day
 * breaches by 0.38 MWh; 0.15 clears it with margin and is still "slowed
 * slightly" - no vehicle is turned away, the energy arrives a little later.
 */
export const MAX_SLOWDOWN = 0.15

/** Cheap hours: midday solar. The battery buys here. */
const CHEAP_FROM_HOUR = 10
const CHEAP_TO_HOUR = 16
/** The evening peak the battery serves when it is not held in reserve. */
const PEAK_FROM_HOUR = 17
const PEAK_TO_HOUR = 21

/**
 * The smallest share of requested load that has to come off the sessions for a
 * day's caps to be holdable, assuming a battery charged to full. The reserve
 * rule achieves that on every constrained day in this data set, but it is not
 * guaranteed in general, so the step loop below re-checks and falls back to the
 * full MAX_SLOWDOWN if the battery turns out to be short.
 *
 * The energy test charges a whole day's excess against one 4 MWh budget and
 * ignores any recharge between two windows on the same day. That is deliberate:
 * it can only over-estimate the share needed, never under-estimate it. Do not
 * "optimise" it without restoring that safety.
 *
 * Zero on almost every constrained day: the battery covers them alone. Only the
 * cold January evening needs anything, because 5.70 MWh has to be held back
 * under a 2.5 MW cap and the peak excess of 2.27 MW is above the battery's
 * 2 MW. Taking the slowdown first and rationing the battery for the remainder
 * is what keeps the cap: discharging greedily empties the battery two hours in
 * and breaches the tail of the window.
 */
function slowdownForDay(
  requested: number[],
  cap: number[],
  battPowerMw: number,
  battEnergyMwh: number,
): number {
  const holds = (share: number) => {
    let energy = 0
    for (let s = 0; s < STEPS_PER_DAY; s++) {
      const excess = requested[s] * (1 - share) - cap[s]
      if (excess > battPowerMw + 1e-9) return false
      if (excess > 0) energy += excess * HOURS_PER_STEP
    }
    return energy <= battEnergyMwh + 1e-9
  }
  if (holds(0)) return 0
  if (!holds(MAX_SLOWDOWN)) return MAX_SLOWDOWN
  let lo = 0
  let hi = MAX_SLOWDOWN
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (holds(mid)) hi = mid
    else lo = mid
  }
  return hi
}

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
export function capsFromWindows(windows: LimitWindow[], defaultLimitMw: number): number[] {
  const caps = new Array<number>(STEPS_PER_DAY).fill(defaultLimitMw)
  for (const win of windows)
    for (let s = win.startHour * 4; s < win.endHour * 4; s++) caps[s] = win.limitMw
  return caps
}

/**
 * A cap the presenter has dragged to, per day of the year, in MW.
 *
 * Held in React state and passed down - never written back into the Limits
 * object, which loadLimits() caches and hands to scene 2 as well.
 */
export type CapOverrides = ReadonlyMap<number, number>

/** The cap this day carries in the data, before any manual override. */
export function scriptedCapMw(limits: Limits, day: number): number {
  const windows = limits.days[day].windows
  return windows.length > 0 ? windows[0].limitMw : limits.meta.defaultLimitMw
}

/**
 * The day's windows after any manual cap.
 *
 * Dragging on a day that already has a window moves that window's level. On a
 * day with no window at all - 2026-06-19 is one - it creates an all-day flat
 * cap, which is the static limitation type rather than an invented time window.
 */
export function windowsForDay(
  limits: Limits,
  day: number,
  overrides?: CapOverrides,
): LimitWindow[] {
  const original = limits.days[day].windows
  const override = overrides?.get(day)
  if (override === undefined) return original
  if (original.length > 0) return original.map((w) => ({ ...w, limitMw: override }))
  return [{ startHour: 0, endHour: 24, limitMw: override }]
}

/** Everything one day needs in order to be planned on its own. */
export interface DayInput {
  dayOfYear: number
  date: string
  reason: string
  windows: LimitWindow[]
  /** The 96 quarter-hour caps, MW. */
  cap: number[]
  /** The 96 quarter-hour requested loads, MW. */
  requested: number[]
  /** A limit today or tomorrow - hold the battery in reserve. */
  reserved: boolean
  /** State of charge at the start of the day, MWh. */
  openingSoc: number
  battPowerMw: number
  battEnergyMwh: number
  defaultLimitMw: number
  year: number
}

export interface DayResult {
  plan: DayPlan
  closingSoc: number
  infeasible: InfeasibleDay | null
}

/**
 * Plans one day.
 *
 * Lifted out of planYear unchanged so a single day can be re-planned while the
 * presenter drags the cap: same arithmetic, same numbers, just called with one
 * day's caps instead of the whole year's. planYear now walks the year calling
 * this, carrying the state of charge from one day into the next.
 */
export function planDay(input: DayInput): DayResult {
  const {
    dayOfYear,
    date,
    reason,
    windows,
    cap,
    requested,
    reserved,
    battPowerMw,
    battEnergyMwh,
    defaultLimitMw,
    year,
  } = input

  const constrained = windows.length > 0
  /** Only slowed as much as this day actually needs - zero on most days. */
  const share = constrained ? slowdownForDay(requested, cap, battPowerMw, battEnergyMwh) : 0

  const delivered = new Array<number>(STEPS_PER_DAY)
  const grid = new Array<number>(STEPS_PER_DAY)
  const battery = new Array<number>(STEPS_PER_DAY)
  const socSeries = new Array<number>(STEPS_PER_DAY)

  let soc = input.openingSoc
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
    const capped = limit < defaultLimitMw
    const hour = hourOf(s)

    let discharge = 0
    let slowed = 0
    let charge = 0

    if (load > limit + 1e-9) {
      // --- the re-plan: slow the sessions by what the day needs, then let
      // the battery carry the rest. Rationing it this way is what holds the
      // tail of a long window; discharging greedily runs it flat too early.
      const excess = load - limit
      energyAboveCapMwh += excess * HOURS_PER_STEP
      slowdownRoomMwh += MAX_SLOWDOWN * load * HOURS_PER_STEP
      slowed = Math.min(share * load, excess)
      discharge = Math.min(battPowerMw, soc / HOURS_PER_STEP, excess - slowed)
      if (excess - slowed - discharge > 1e-9) {
        // The battery came up short of what the day's plan assumed. Take the
        // rest off the sessions rather than breach - never worse than the
        // plain greedy rule, whatever state the battery is in.
        slowed = Math.min(MAX_SLOWDOWN * load, excess)
        discharge = Math.min(battPowerMw, soc / HOURS_PER_STEP, excess - slowed)
      }
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

  const firstCapStep = windows.length > 0 ? windows[0].startHour * 4 : -1
  const weekdayIndex = new Date(Date.UTC(year, 0, 1 + dayOfYear)).getUTCDay()

  const plan: DayPlan = {
    dayOfYear,
    date,
    weekend: weekdayIndex === 0 || weekdayIndex === 6,
    constrained,
    reason,
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
  }

  const infeasible: InfeasibleDay | null =
    breachSteps > 0
      ? {
          date,
          dayOfYear,
          energyAboveCapMwh,
          batteryMwh: dischargedMwh,
          slowdownMwh: slowdownRoomMwh,
          deficitMwh: energyAboveCapMwh - dischargedMwh - slowdownRoomMwh,
          neededSlowdown:
            slowdownRoomMwh > 0
              ? ((energyAboveCapMwh - dischargedMwh) / slowdownRoomMwh) * MAX_SLOWDOWN
              : Number.POSITIVE_INFINITY,
          worstOvershootMw,
        }
      : null

  return { plan, closingSoc: soc, infeasible }
}

/** Assembles one day's input from the data plus any manual cap. */
function dayInput(
  profile: Profile,
  limits: Limits,
  day: number,
  openingSoc: number,
  overrides?: CapOverrides,
): DayInput {
  const windows = windowsForDay(limits, day, overrides)
  const scripted = limits.days[day].windows
  const constrainedTomorrow =
    day + 1 < DAYS_PER_YEAR && windowsForDay(limits, day + 1, overrides).length > 0
  return {
    dayOfYear: day,
    date: limits.days[day].date,
    // A window the presenter created is not something the operator issued, so it
    // is not given the operator's wording.
    reason: scripted.length === 0 && windows.length > 0 ? 'Manual cap' : limits.days[day].reason,
    windows,
    cap: capsFromWindows(windows, limits.meta.defaultLimitMw),
    requested: profile.values.slice(day * STEPS_PER_DAY, (day + 1) * STEPS_PER_DAY),
    // A limit is announced day-ahead, so the evening before counts as reserved too.
    reserved: windows.length > 0 || constrainedTomorrow,
    openingSoc,
    battPowerMw: profile.meta.batteryPowerMw,
    battEnergyMwh: profile.meta.batteryEnergyMwh,
    defaultLimitMw: limits.meta.defaultLimitMw,
    year: limits.meta.year,
  }
}

/**
 * Re-plans a single day against a cap the presenter is dragging, starting from
 * the battery state the committed plan left at the end of the day before.
 *
 * Cheap enough to run on every pointer move. The year totals it does not touch
 * stay stale until the drag is released and planYear runs again.
 */
export function replanDay(
  profile: Profile,
  limits: Limits,
  day: number,
  committed: YearPlan,
  overrides: CapOverrides,
): DayPlan {
  const closingSocOf = (d: number) =>
    d >= 0 ? committed.days[d].soc[STEPS_PER_DAY - 1] : profile.meta.batteryEnergyMwh

  if (day === 0) return planDay(dayInput(profile, limits, 0, closingSocOf(-1), overrides)).plan

  // A limit is announced day-ahead, so moving one moves the evening before it
  // too: that is when the battery stops trading and charges to full instead.
  // Re-plan that day first, or this one starts from a state of charge the new
  // cap would never have left behind - which is exactly where a cheaper version
  // of this function disagreed with planYear.
  //
  // One day back is enough. The day before that reserves against *this* day's
  // neighbour, whose windows the drag does not touch.
  const previous = planDay(
    dayInput(profile, limits, day - 1, closingSocOf(day - 2), overrides),
  )
  return planDay(dayInput(profile, limits, day, previous.closingSoc, overrides)).plan
}

/**
 * Plans the whole year. `profile.values` is the requested load the customer would
 * draw with no limit at all; the plan is what the site actually does instead.
 */
export function planYear(profile: Profile, limits: Limits, overrides?: CapOverrides): YearPlan {
  const margin = profile.meta.marginEurPerMwh

  const days: DayPlan[] = []
  const revenueByDay: number[] = []
  const breachesByDay: number[] = []
  const infeasible: InfeasibleDay[] = []

  let soc = profile.meta.batteryEnergyMwh
  let runRequested = 0
  let runServed = 0
  let runSlowed = 0
  let runDischarged = 0
  let runBreaches = 0
  let breachDays = 0

  for (let d = 0; d < DAYS_PER_YEAR; d++) {
    const result = planDay(dayInput(profile, limits, d, soc, overrides))
    soc = result.closingSoc
    days.push(result.plan)

    if (result.infeasible) {
      breachDays++
      infeasible.push(result.infeasible)
    }

    runRequested += result.plan.requested.reduce((a, b) => a + b, 0) * HOURS_PER_STEP
    runServed += result.plan.servedMwh
    runSlowed += result.plan.slowedMwh
    runDischarged += result.plan.dischargedMwh
    runBreaches += result.plan.breachSteps
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
