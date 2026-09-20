import { memo, useCallback, useRef } from 'react'
import { Button, Chip, Surface } from '../../design'
import { hhmm, longDate } from './format'
import { DAYS_PER_YEAR, type DayPlan } from './replan'

/**
 * The date, the limit in force, and the year to pick a day from.
 *
 * There used to be a transport here - play, pause, 1x/2x/4x - because the scene
 * played itself. It does not any more: the presenter drives, so the controls are
 * the ones that move between days.
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
  day: number
  jumps: ReadonlyArray<{ day: number; short: string }>
  /** How many days carry a cap the presenter set. */
  overrides: number
  onSelectDay: (day: number) => void
  onPrevDay: () => void
  onNextDay: () => void
  onReset: () => void
  onShowYear: () => void
  onShowTermSheet: () => void
  /** False when no operator was chosen, which leaves nothing to print. */
  canPrint: boolean
}

export function TopBar({
  days,
  today,
  day,
  jumps,
  overrides,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onReset,
  onShowYear,
  onShowTermSheet,
  canPrint,
}: TopBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  /**
   * A ref, not state. Pointer moves arrive faster than React commits, so a
   * handler closed over a state flag from the render before the press drops
   * the opening moves - the same fault the cap handle had, and the same fix.
   */
  const scrubbingRef = useRef(false)

  /**
   * The track is a plain element, so its bounding rect already carries the
   * stage's scale - a ratio across it needs no correction.
   */
  const dayAt = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    // Every marker on this track - the thumb, the constrained ticks, the jump
    // diamonds - is positioned at day / DAYS_PER_YEAR. Mapping a click back
    // through DAYS_PER_YEAR - 1 put the two scales half a day apart, so from
    // roughly July on, clicking a tick selected the day before it.
    const share = (clientX - rect.left) / rect.width
    return Math.floor(share * DAYS_PER_YEAR)
  }, [])

  const onTrackDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      scrubbingRef.current = true
      onSelectDay(dayAt(e.clientX))
    },
    [dayAt, onSelectDay],
  )

  const onTrackMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbingRef.current) return
      onSelectDay(dayAt(e.clientX))
    },
    [dayAt, onSelectDay],
  )

  const onTrackUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    scrubbingRef.current = false
    // After a pointercancel the pointer is gone and releasing an unknown id
    // throws NotFoundError.
    if (e.currentTarget.hasPointerCapture?.(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  const win = today.windows[0]
  const position = `${(day / DAYS_PER_YEAR) * 100}%`

  return (
    <Surface className="shrink-0 px-6 py-5">
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onPrevDay} aria-label="Previous day">
              &lsaquo;
            </Button>
            <Button variant="ghost" size="sm" onClick={onNextDay} aria-label="Next day">
              &rsaquo;
            </Button>
          </div>
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
            <Button
              key={j.day}
              variant={j.day === day ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={j.day === day}
              onClick={() => onSelectDay(j.day)}
            >
              {j.short}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-border pl-4">
          <Button variant="outline" size="sm" onClick={onReset} disabled={overrides === 0}>
            Reset{overrides > 0 ? ` (${overrides})` : ''}
          </Button>
          <Button variant="secondary" size="sm" onClick={onShowYear}>
            Year
          </Button>
          <Button size="sm" onClick={onShowTermSheet} disabled={!canPrint}>
            Term sheet
          </Button>
        </div>
      </div>

      {/* ---- the year, as a day picker */}
      <div className="relative mt-5">
        <div
          ref={trackRef}
          role="presentation"
          onPointerDown={onTrackDown}
          onPointerMove={onTrackMove}
          onPointerUp={onTrackUp}
          onPointerCancel={onTrackUp}
          className="relative h-2 w-full cursor-pointer overflow-hidden rounded-full border border-border bg-muted"
        >
          <div
            className="absolute inset-y-0 left-0 bg-foreground/25"
            style={{ width: position }}
          />
          <ConstrainedTicks days={days} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-background"
          style={{ left: position }}
        />
        {jumps.map((j) => (
          <button
            key={j.day}
            type="button"
            title={j.short}
            aria-label={`Go to ${j.short}`}
            onClick={() => onSelectDay(j.day)}
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
