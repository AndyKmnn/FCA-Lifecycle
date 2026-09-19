import { memo, useEffect, useRef } from 'react'
import { Button, Chip, Surface } from '../../design'
import { hhmm, longDate } from './format'
import { SPEEDS, type Speed } from './script'
import { DAYS_PER_YEAR, type DayPlan } from './replan'
import type { Frame } from './useReplay'

/**
 * Year progress and transport.
 *
 * The progress fill and the playhead are written straight to the DOM from the
 * replay clock; only the date and the button states come from React. Amber on
 * this bar means exactly what it means on the chart: a day-ahead limit.
 */

/** One mark per constrained day. Memoised - the track never changes, but the bar
 *  around it re-renders on every day of the year. */
const ConstrainedTicks = memo(function ConstrainedTicks({ days }: { days: DayPlan[] }) {
  return (
    <>
      {days.map((d) =>
        d.constrained ? (
          <span
            key={d.date}
            aria-hidden
            className="absolute inset-y-0 w-px bg-primary"
            style={{ left: `${(d.dayOfYear / DAYS_PER_YEAR) * 100}%` }}
          />
        ) : null,
      )}
    </>
  )
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Day of the year each month starts on, 2026 - not a leap year. */
const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

export interface TopBarProps {
  days: DayPlan[]
  today: DayPlan
  jumps: ReadonlyArray<{ day: number; short: string }>
  playing: boolean
  speed: Speed
  subscribe: (fn: (f: Frame) => void) => () => void
  frame: () => Frame
  onToggle: () => void
  onSpeed: (s: Speed) => void
  onJump: (day: number) => void
}

export function TopBar({
  days,
  today,
  jumps,
  playing,
  speed,
  subscribe,
  frame,
  onToggle,
  onSpeed,
  onJump,
}: TopBarProps) {
  const fillRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const paint = (f: Frame) => {
      const pct = `${(f.yearProgress * 100).toFixed(3)}%`
      if (fillRef.current) fillRef.current.style.width = pct
      if (headRef.current) headRef.current.style.left = pct
    }
    paint(frame())
    return subscribe(paint)
  }, [subscribe, frame])

  const win = today.windows[0]

  return (
    <Surface className="shrink-0 px-6 py-5">
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="tabular text-[26px] leading-none font-semibold tracking-[-0.03em] text-foreground">
            {longDate(today.date)}
          </span>
          {today.constrained && win ? (
            <Chip tone="accent" className="tabular">
              Limit {win.limitMw.toFixed(1)} MW &middot; {hhmm(win.startHour)}-{hhmm(win.endHour)}
            </Chip>
          ) : (
            <Chip>No limit</Chip>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {jumps.map((j) => (
            <Button key={j.day} variant="outline" size="sm" onClick={() => onJump(j.day)}>
              {j.short}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="w-[72px]"
          >
            {playing ? 'Pause' : 'Play'}
          </Button>
          <div className="flex items-center gap-1">
            {SPEEDS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === speed ? 'secondary' : 'ghost'}
                aria-pressed={s === speed}
                onClick={() => onSpeed(s)}
                className={`tabular w-9 ${s === speed ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- the year */}
      <div className="relative mt-5">
        <div className="relative h-2 w-full overflow-hidden rounded-full border border-border bg-muted">
          <div
            ref={fillRef}
            className="absolute inset-y-0 left-0 bg-foreground/25"
            style={{ width: 0 }}
          />
          <ConstrainedTicks days={days} />
        </div>
        <div
          ref={headRef}
          aria-hidden
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-background"
          style={{ left: 0 }}
        />
        {jumps.map((j) => (
          <button
            key={j.day}
            type="button"
            title={j.short}
            aria-label={`Jump to ${j.short}`}
            onClick={() => onJump(j.day)}
            className="absolute -bottom-2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[1px] border border-foreground bg-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            style={{ left: `${(j.day / DAYS_PER_YEAR) * 100}%` }}
          />
        ))}
      </div>

      <div className="relative mt-4 h-3">
        {MONTHS.map((m, i) => (
          <span
            key={m}
            className="micro absolute text-muted-foreground"
            style={{ left: `${(MONTH_STARTS[i] / DAYS_PER_YEAR) * 100}%` }}
          >
            {m}
          </span>
        ))}
      </div>
    </Surface>
  )
}
