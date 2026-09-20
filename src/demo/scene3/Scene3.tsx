import { useCallback, useEffect, useMemo, useState } from 'react'
import { Surface } from '../../design'
import { dayIndex, loadLimits, loadProfile, type Limits, type Profile } from '../../data'
import { Console } from './Console'
import { CountersPanel } from './CountersPanel'
import { EndCard } from './EndCard'
import { Timeline } from './Timeline'
import { TopBar } from './TopBar'
import {
  MAX_SLOWDOWN,
  planYear,
  replanDay,
  scriptedCapMw,
  type CapOverrides,
  type YearPlan,
} from './replan'
import { getChosen } from '../scene1/selection'
import { TermSheet } from './TermSheet'
import { JUMP_DAYS } from './script'
import { useDaySelection } from './useDaySelection'

/**
 * Scene 3 - the autopilot, driven by hand.
 *
 * The presenter picks a day and drags the day-ahead cap; the autopilot re-plans
 * that day underneath the line. Two costs, deliberately split:
 *
 *   during a drag  - one day is re-planned, on every pointer move. Microseconds,
 *                    and enough to move every series on the chart.
 *   on release     - the whole year is re-planned, because the battery's state of
 *                    charge carries across midnight and the year totals would
 *                    otherwise be a day stale.
 *
 * Nothing is written back into the Limits object: loadLimits() caches one
 * instance and hands the same one to scene 2.
 */
export default function Scene3() {
  const [data, setData] = useState<{ profile: Profile; limits: Limits } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([loadProfile(), loadLimits()])
      .then(([profile, limits]) => {
        if (live) setData({ profile, limits })
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      live = false
    }
  }, [])

  if (error) return <Notice>Could not load the demo data: {error}</Notice>
  if (!data) return <Notice>Planning the year&hellip;</Notice>
  return <Explorer profile={data.profile} limits={data.limits} />
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Surface className="flex h-full w-full items-center justify-center p-16">
      <p className="text-xl text-muted-foreground">{children}</p>
    </Surface>
  )
}

const EMPTY: CapOverrides = new Map<number, number>()

/**
 * How far down the cap can be dragged, MW.
 *
 * Not the agreement's guaranteed minimum, which is where this was clamped at
 * first. On 2026-01-20 the cap already sits on that guarantee, so the line could
 * not move down at all on the very day the scene opens - and the question the
 * presenter is there to answer is what happens when it does. Below the
 * guarantee the chart says so.
 */
const DRAG_FLOOR_MW = 1

function Explorer({ profile, limits }: { profile: Profile; limits: Limits }) {
  const jumps = useMemo(
    () => JUMP_DAYS.map((j) => ({ day: dayIndex(j.date, limits.meta.year), short: j.short })),
    [limits.meta.year],
  )

  // Opening on a day that carries a limit, so the scene says what it is about
  // before anyone touches it.
  const { day, setDay, nextDay, prevDay } = useDaySelection(jumps[0]?.day ?? 0)

  const [overrides, setOverrides] = useState<CapOverrides>(EMPTY)
  /** The cap under the cursor mid-drag, before the year has been re-planned. */
  const [draft, setDraft] = useState<{ day: number; mw: number } | null>(null)
  const [showYear, setShowYear] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  /** Read once: the presenter's choice cannot change while this scene is up. */
  const chosen = useMemo(() => getChosen(), [])

  const plan: YearPlan = useMemo(
    () => planYear(profile, limits, overrides),
    [profile, limits, overrides],
  )

  const scripted = scriptedCapMw(limits, day)
  const capMw = draft?.day === day ? draft.mw : (overrides.get(day) ?? scripted)

  /** The day on screen: the committed plan, or a one-day re-plan while dragging. */
  const today = useMemo(() => {
    if (draft?.day !== day) return plan.days[day]
    const withDraft = new Map(overrides)
    withDraft.set(day, draft.mw)
    return replanDay(profile, limits, day, plan, withDraft)
  }, [draft, day, plan, overrides, profile, limits])

  const onCapDrag = useCallback((mw: number) => setDraft({ day, mw }), [day])

  const onCapCommit = useCallback(
    (mw: number) => {
      setDraft(null)
      setOverrides((current) => {
        const next = new Map(current)
        // Back on the level the data carries is not an override, it is the data.
        if (Math.abs(mw - scripted) < 1e-9) next.delete(day)
        else next.set(day, mw)
        return next
      })
    },
    [day, scripted],
  )

  const onReset = useCallback(() => {
    setDraft(null)
    setOverrides(EMPTY)
  }, [])

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <TopBar
        days={plan.days}
        today={today}
        day={day}
        jumps={jumps}
        overrides={overrides.size}
        onSelectDay={setDay}
        onPrevDay={prevDay}
        onNextDay={nextDay}
        onReset={onReset}
        onShowYear={() => setShowYear(true)}
        onShowTermSheet={() => setShowSheet(true)}
        canPrint={chosen !== null}
      />

      <div className="relative flex min-h-0 flex-1 gap-5">
        <Console
          days={plan.days}
          day={day}
          operator={limits.meta.operator}
          defaultLimitMw={limits.meta.defaultLimitMw}
        />
        <Timeline
          plan={today}
          capMw={capMw}
          minMw={DRAG_FLOOR_MW}
          maxMw={limits.meta.defaultLimitMw}
          guaranteedMw={limits.meta.guaranteedMinimumMw}
          overridden={overrides.has(day) || draft?.day === day}
          onCapDrag={onCapDrag}
          onCapCommit={onCapCommit}
        />
        <CountersPanel plan={plan} today={today} />

        {showYear ? <EndCard plan={plan} onClose={() => setShowYear(false)} /> : null}
      </div>

      <FootNote plan={plan} />

      {showSheet && chosen ? (
        <TermSheet
          chosen={chosen}
          profile={profile}
          plan={plan}
          year={limits.meta.year}
          onClose={() => setShowSheet(false)}
        />
      ) : null}
    </div>
  )
}

/** Shown only when the greedy rule cannot hold a cap - never hidden, never faked. */
function FootNote({ plan }: { plan: YearPlan }) {
  if (plan.feasible) return null
  const shown = plan.infeasible.slice(0, 3)
  const rest = plan.infeasible.length - shown.length
  return (
    <Surface variant="inset" radius="md" className="shrink-0 px-5 py-3">
      <div className="flex items-center gap-4 text-[13px] font-medium text-warn">
        <span>
          The greedy rule cannot hold the cap on{' '}
          {shown.map((d) => d.date).join(', ')}
          {rest > 0 ? ` and ${rest} more ${rest === 1 ? 'day' : 'days'}` : ''}: short by{' '}
          {shown.map((d) => `${d.deficitMwh.toFixed(2)} MWh`).join(', ')} after a full battery
          and a {+(MAX_SLOWDOWN * 100).toFixed(1)}% slowdown.
        </span>
      </div>
    </Surface>
  )
}
