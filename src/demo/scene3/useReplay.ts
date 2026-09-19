import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONSTRAINED_DAY_SECONDS, REPLAY_SECONDS, type Speed } from './script'
import { DAYS_PER_YEAR, type YearPlan } from './replan'

/**
 * The replay clock. One year in about REPLAY_SECONDS, with the constrained days
 * held long enough to watch the re-plan and the quiet days flying past.
 *
 * The clock runs in a single requestAnimationFrame loop and writes the fast-moving
 * values (position within the day, progress bar) straight to subscriber callbacks,
 * so nothing re-renders at 60 Hz. React state changes only when the day changes
 * and on a slow tick for the panel numbers.
 */

export interface Frame {
  /** 0-364 */
  day: number
  /** 0-1 through the current day. */
  dayProgress: number
  /** 0-1 through the year. */
  yearProgress: number
  /** Fractional quarter-hour step, 0-96. */
  step: number
}

export interface Replay {
  day: number
  playing: boolean
  finished: boolean
  speed: Speed
  /** Bumped on every slow tick so panel numbers refresh. */
  tick: number
  frame: () => Frame
  subscribe: (fn: (f: Frame) => void) => () => void
  play: () => void
  pause: () => void
  toggle: () => void
  setSpeed: (s: Speed) => void
  jumpTo: (day: number) => void
  restart: () => void
}

/** Seconds of replay for each day, and the cumulative start time of each. */
function buildSchedule(plan: YearPlan) {
  const constrained = plan.days.map((d) => d.constrained)
  const nConstrained = constrained.filter(Boolean).length
  const quietBudget = Math.max(
    1,
    REPLAY_SECONDS - nConstrained * CONSTRAINED_DAY_SECONDS,
  )
  const quiet = quietBudget / Math.max(1, DAYS_PER_YEAR - nConstrained)

  const duration = constrained.map((c) => (c ? CONSTRAINED_DAY_SECONDS : quiet))
  const start = new Array<number>(DAYS_PER_YEAR)
  let acc = 0
  for (let d = 0; d < DAYS_PER_YEAR; d++) {
    start[d] = acc
    acc += duration[d]
  }
  return { duration, start, total: acc }
}

/** Panel numbers refresh at 10 Hz - smooth to the eye, cheap for React. */
const TICK_MS = 100

export function useReplay(plan: YearPlan): Replay {
  const schedule = useMemo(() => buildSchedule(plan), [plan])

  const [day, setDay] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [finished, setFinished] = useState(false)
  const [speed, setSpeedState] = useState<Speed>(1)
  const [tick, setTick] = useState(0)

  const elapsed = useRef(0)
  const dayRef = useRef(0)
  const speedRef = useRef<Speed>(1)
  const playingRef = useRef(true)
  const subscribers = useRef(new Set<(f: Frame) => void>())

  const frameOf = useCallback(
    (t: number): Frame => {
      const clamped = Math.min(t, schedule.total)
      let d = dayRef.current
      // The clock only ever moves forward between frames, but a jump can move it
      // anywhere, so walk in whichever direction is needed.
      while (d > 0 && clamped < schedule.start[d]) d--
      while (d < DAYS_PER_YEAR - 1 && clamped >= schedule.start[d + 1]) d++
      const progress = Math.min(
        1,
        (clamped - schedule.start[d]) / schedule.duration[d],
      )
      return {
        day: d,
        dayProgress: progress,
        yearProgress: clamped / schedule.total,
        step: progress * 96,
      }
    },
    [schedule],
  )

  const frame = useCallback(() => frameOf(elapsed.current), [frameOf])

  const publish = useCallback(() => {
    const f = frame()
    dayRef.current = f.day
    for (const fn of subscribers.current) fn(f)
    return f
  }, [frame])

  const subscribe = useCallback((fn: (f: Frame) => void) => {
    subscribers.current.add(fn)
    return () => {
      subscribers.current.delete(fn)
    }
  }, [])

  // ---------------------------------------------------------------- the loop
  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (playingRef.current) {
        elapsed.current += dt * speedRef.current
        if (elapsed.current >= schedule.total) {
          elapsed.current = schedule.total
          playingRef.current = false
          setPlaying(false)
          setFinished(true)
        }
      }
      const f = publish()
      setDay((d) => (d === f.day ? d : f.day))
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [publish, schedule.total])

  // Slow tick for the panel numbers.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const play = useCallback(() => {
    if (elapsed.current >= schedule.total) return
    playingRef.current = true
    setPlaying(true)
  }, [schedule.total])

  const pause = useCallback(() => {
    playingRef.current = false
    setPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (playingRef.current) pause()
    else play()
  }, [pause, play])

  const setSpeed = useCallback((s: Speed) => {
    speedRef.current = s
    setSpeedState(s)
  }, [])

  const jumpTo = useCallback(
    (target: number) => {
      elapsed.current = schedule.start[Math.max(0, Math.min(DAYS_PER_YEAR - 1, target))]
      setFinished(false)
      publish()
      setDay(target)
    },
    [publish, schedule],
  )

  const restart = useCallback(() => {
    elapsed.current = 0
    dayRef.current = 0
    setFinished(false)
    playingRef.current = true
    setPlaying(true)
    publish()
    setDay(0)
  }, [publish])

  return {
    day,
    playing,
    finished,
    speed,
    tick,
    frame,
    subscribe,
    play,
    pause,
    toggle,
    setSpeed,
    jumpTo,
    restart,
  }
}
