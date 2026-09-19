import { useEffect, useMemo, useState } from 'react'
import { Label, Surface } from '../../design'
import { dayIndex, loadLimits, loadProfile, type Limits, type Profile } from '../../data'
import { Console } from './Console'
import { CountersPanel } from './CountersPanel'
import { EndCard } from './EndCard'
import { Timeline } from './Timeline'
import { TopBar } from './TopBar'
import { MAX_SLOWDOWN, planYear, type YearPlan } from './replan'
import { JUMP_DAYS } from './script'
import { useReplay } from './useReplay'

/**
 * Scene 3 - Autopilot replay. One year of day-ahead limits in about 90 seconds.
 *
 * The whole year is planned once, up front, by replan.ts; the replay only ever
 * animates that precomputed result, so the frame loop does no arithmetic beyond
 * moving a clip rectangle and a progress bar.
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
  return <Replay profile={data.profile} limits={data.limits} />
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Surface className="flex h-full w-full items-center justify-center p-16">
      <p className="text-xl text-muted-foreground">{children}</p>
    </Surface>
  )
}

function Replay({ profile, limits }: { profile: Profile; limits: Limits }) {
  const plan: YearPlan = useMemo(() => planYear(profile, limits), [profile, limits])
  const replay = useReplay(plan)
  const { day, tick, frame, subscribe, toggle, setSpeed, jumpTo, restart } = replay

  const jumps = useMemo(
    () =>
      JUMP_DAYS.map((j) => ({ day: dayIndex(j.date, limits.meta.year), short: j.short })),
    [limits.meta.year],
  )

  // Play / pause without touching the shell's own keys (arrows, space, R).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // The slow tick drives the panel numbers; the chart and console are memoised
  // on the day, so they do not re-render with it. Reading the clock here is what
  // turns that 10 Hz tick into fresh figures.
  void tick
  const live = frame()

  const today = plan.days[day]

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <TopBar
        days={plan.days}
        today={today}
        jumps={jumps}
        playing={replay.playing}
        speed={replay.speed}
        subscribe={subscribe}
        frame={frame}
        onToggle={toggle}
        onSpeed={setSpeed}
        onJump={jumpTo}
      />

      <div className="relative flex min-h-0 flex-1 gap-5">
        <Console
          days={plan.days}
          day={day}
          operator={limits.meta.operator}
          defaultLimitMw={limits.meta.defaultLimitMw}
        />
        <Timeline plan={today} subscribe={subscribe} frame={frame} />
        <CountersPanel
          plan={plan}
          day={day}
          dayProgress={live.dayProgress}
          yearProgress={live.yearProgress}
          settled={replay.finished}
        />

        {replay.finished ? <EndCard plan={plan} onReplay={restart} /> : null}
      </div>

      <FootNote plan={plan} />
    </div>
  )
}

/** Shown only when the greedy rule cannot hold a cap - never hidden, never faked. */
function FootNote({ plan }: { plan: YearPlan }) {
  if (plan.feasible) return null
  return (
    <Surface variant="inset" radius="md" className="shrink-0 px-5 py-3">
      <div className="flex items-center gap-4 text-[13px] font-medium text-warn">
        <Label kind="simulation" className="shrink-0" />
        <span>
          The greedy rule cannot hold the cap on{' '}
          {plan.infeasible.map((d) => d.date).join(', ')}: short by{' '}
          {plan.infeasible.map((d) => `${d.deficitMwh.toFixed(2)} MWh`).join(', ')} after a full
          battery and a {Math.round(MAX_SLOWDOWN * 100)}% slowdown.
        </span>
      </div>
    </Surface>
  )
}
