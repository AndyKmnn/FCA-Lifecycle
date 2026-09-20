import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CHART, Chip, Surface } from '../../design'
import { STEPS_PER_DAY, type DayPlan } from './replan'

/**
 * The day's schedule, drawn as flat SVG - hairline axes, no shadows, no fills
 * with a gradient in them.
 *
 * Amber means one thing on this screen: the day-ahead limit. The cap line and
 * the window it applies to are amber; every other series is navy, grey or a
 * signal colour, so the eye goes to the limit and to what the site does about it.
 *
 * The cap line is also the control. The presenter drags it, and the autopilot
 * re-plans the day underneath it - the slowdown band and the battery area move
 * while the line moves. That is the whole point of the scene: the limit is the
 * one number the customer negotiates, so it is the one thing you can grab.
 *
 * The day is always drawn whole. An earlier version swept it in from the left in
 * step with a replay clock; the clock is gone, and with it the sweep.
 */

const W = 960
const H = 452
const PAD = { l: 54, r: 18, t: 18, b: 34 }
const PLOT_W = W - PAD.l - PAD.r
const PLOT_H = H - PAD.t - PAD.b
const Y_MAX = 6.4

/** Caps in the data are all one decimal, so the drag lands on the same grid. */
const STEP_MW = 0.1

const xOf = (step: number) => PAD.l + (step / STEPS_PER_DAY) * PLOT_W
const yOf = (mw: number) => PAD.t + PLOT_H - (Math.max(0, mw) / Y_MAX) * PLOT_H
/** The inverse of yOf, for turning a pointer position back into megawatts. */
const mwOf = (y: number) => ((PAD.t + PLOT_H - y) / PLOT_H) * Y_MAX

/** A straight line through the middle of each quarter-hour. */
function linePath(series: number[]): string {
  let d = ''
  for (let s = 0; s < series.length; s++)
    d += `${s === 0 ? 'M' : 'L'}${xOf(s + 0.5).toFixed(2)} ${yOf(series[s]).toFixed(2)}`
  return d
}

/** A step line - the cap holds its value across the whole quarter-hour. */
function stepPath(series: number[]): string {
  let d = `M${xOf(0).toFixed(2)} ${yOf(series[0]).toFixed(2)}`
  for (let s = 0; s < series.length; s++) {
    d += `L${xOf(s).toFixed(2)} ${yOf(series[s]).toFixed(2)}`
    d += `L${xOf(s + 1).toFixed(2)} ${yOf(series[s]).toFixed(2)}`
  }
  return d
}

/** The closed area between two series. */
function bandPath(upper: number[], lower: number[]): string {
  let d = ''
  for (let s = 0; s < upper.length; s++)
    d += `${s === 0 ? 'M' : 'L'}${xOf(s + 0.5).toFixed(2)} ${yOf(upper[s]).toFixed(2)}`
  for (let s = lower.length - 1; s >= 0; s--)
    d += `L${xOf(s + 0.5).toFixed(2)} ${yOf(lower[s]).toFixed(2)}`
  return `${d}Z`
}

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]
const MW_TICKS = [0, 1, 2, 3, 4, 5, 6]

export interface TimelineProps {
  plan: DayPlan
  /** The level the draggable line currently sits at, MW. */
  capMw: number
  minMw: number
  maxMw: number
  /** The firm level the agreement guarantees. Draggable below, but marked. */
  guaranteedMw: number
  /** True once this day carries a cap the presenter set rather than the data. */
  overridden: boolean
  /** Fired continuously while dragging - re-plans this day only. */
  onCapDrag: (mw: number) => void
  /** Fired on release - re-plans the whole year. */
  onCapCommit: (mw: number) => void
}

function TimelineInner({
  plan,
  capMw,
  minMw,
  maxMw,
  guaranteedMw,
  overridden,
  onCapDrag,
  onCapCommit,
}: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)
  /**
   * The drag runs on refs, not on the dragging state.
   *
   * Pointer moves arrive faster than React commits, so a move handler closed
   * over `dragging` from the render before the press still sees false and throws
   * the first moves away. The ref is true the instant the press lands.
   */
  const draggingRef = useRef(false)
  /** The last level the pointer was over - what a release commits. */
  const latestRef = useRef(capMw)

  const paths = useMemo(() => {
    // Where the battery is discharging the meter sits below what the vehicles
    // get; where it is charging it sits above. Two bands, so buying and giving
    // back never look like the same thing.
    const discharging = plan.battery.map((b) => b > 0)
    const clampTo = (keep: boolean[]) =>
      plan.grid.map((g, i) => (keep[i] ? g : plan.delivered[i]))
    return {
      requested: linePath(plan.requested),
      grid: linePath(plan.grid),
      cap: stepPath(plan.cap),
      discharge: bandPath(plan.delivered, clampTo(discharging)),
      charge: bandPath(clampTo(discharging.map((d) => !d)), plan.delivered),
      slowed: bandPath(plan.requested, plan.delivered),
      breach: plan.grid.map((g, i) => (g > plan.cap[i] + 1e-6 ? i : -1)).filter((i) => i >= 0),
    }
  }, [plan])

  // The day changed, or Reset ran, or a key nudged it: keep the ref in step so a
  // later drag starts from what is on screen.
  useEffect(() => {
    if (!draggingRef.current) latestRef.current = capMw
  }, [capMw])

  const settle = useCallback(
    (mw: number) => Math.min(maxMw, Math.max(minMw, Math.round(mw / STEP_MW) * STEP_MW)),
    [minMw, maxMw],
  )

  /**
   * Pointer position to megawatts.
   *
   * getScreenCTM() is what makes this correct rather than approximately correct:
   * the presenter view scales the whole 1920x1080 stage with a CSS transform, and
   * the SVG is letterboxed inside its own box by the viewBox. The screen CTM
   * carries both, so clientY maps straight back to user units. Reading
   * movementY or a bounding rect by hand gets this wrong at any scale but 1.
   */
  const mwAt = useCallback(
    (clientY: number): number => {
      const ctm = svgRef.current?.getScreenCTM()
      if (!ctm) return latestRef.current
      const point = new DOMPoint(0, clientY).matrixTransform(ctm.inverse())
      return settle(mwOf(point.y))
    },
    [settle],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      draggingRef.current = true
      setDragging(true)
      const mw = mwAt(e.clientY)
      latestRef.current = mw
      onCapDrag(mw)
    },
    [mwAt, onCapDrag],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!draggingRef.current) return
      const mw = mwAt(e.clientY)
      latestRef.current = mw
      onCapDrag(mw)
    },
    [mwAt, onCapDrag],
  )

  /**
   * Ends the drag on release, on cancel, and on a lost capture alike.
   *
   * It commits the last level the pointer was actually over rather than reading
   * the ending event: a pointercancel carries whatever position the browser
   * abandoned the gesture at, which is not where the presenter left the line.
   */
  const endDrag = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    onCapCommit(latestRef.current)
  }, [onCapCommit])

  /**
   * Up and down are free: the shell's global key handler takes only the arrows
   * left and right, space and R. Nudging the cap therefore cannot move the scene.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGGElement>) => {
      const by =
        e.key === 'ArrowUp' ? STEP_MW
        : e.key === 'ArrowDown' ? -STEP_MW
        : e.key === 'PageUp' ? STEP_MW * 5
        : e.key === 'PageDown' ? -STEP_MW * 5
        : 0
      if (by === 0) return
      e.preventDefault()
      e.stopPropagation()
      const mw = settle(capMw + by)
      latestRef.current = mw
      onCapCommit(mw)
    },
    [capMw, onCapCommit, settle],
  )

  const charging = plan.chargedMwh > 0.01
  const active = dragging || focused
  const capY = yOf(capMw)

  return (
    <Surface className="flex min-h-0 flex-1 flex-col p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">
            Day-ahead schedule
          </h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {plan.constrained
              ? `Limit in force - ${plan.reason}`
              : `${plan.reason} - full ${plan.cap[0].toFixed(1)} MW connection available`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {capMw < guaranteedMw - 1e-9 ? (
            <Chip className="text-warn">Below the guaranteed {guaranteedMw.toFixed(1)} MW</Chip>
          ) : null}
          {overridden ? <Chip selected>Manual override</Chip> : null}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full flex-1 select-none"
        role="img"
        aria-label={`Schedule for ${plan.date}`}
      >
        {/* ---- hairline grid and axes */}
        {MW_TICKS.map((mw) => (
          <g key={mw}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={yOf(mw)}
              y2={yOf(mw)}
              stroke={CHART.grid}
              strokeWidth={1}
            />
            <text
              x={PAD.l - 10}
              y={yOf(mw) + 4}
              textAnchor="end"
              fontSize={12}
              fill={CHART.axis}
              fontWeight={500}
            >
              {mw}
            </text>
          </g>
        ))}
        <text x={PAD.l - 10} y={PAD.t - 4} textAnchor="end" fontSize={11} fill={CHART.axis}>
          MW
        </text>
        {HOUR_TICKS.map((h) => (
          <text
            key={h}
            x={xOf(h * 4)}
            y={H - 12}
            textAnchor="middle"
            fontSize={12}
            fill={CHART.axis}
            fontWeight={500}
          >
            {String(h).padStart(2, '0')}
          </text>
        ))}

        {/* ---- the constrained window: the one amber area on this screen */}
        {plan.windows.map((win) => (
          <rect
            key={`${win.startHour}-${win.endHour}`}
            x={xOf(win.startHour * 4)}
            width={xOf(win.endHour * 4) - xOf(win.startHour * 4)}
            y={PAD.t}
            height={PLOT_H}
            fill={CHART.accent}
            opacity={0.08}
          />
        ))}

        {/* ---- sessions slowed: the gap between requested and delivered */}
        <path d={paths.slowed} fill={CHART.warn} opacity={0.22} />
        {/* ---- the battery: giving back, and buying */}
        <path d={paths.charge} fill={CHART.muted} opacity={0.2} />
        <path d={paths.discharge} fill={CHART.ok} opacity={0.18} />
        {/* ---- requested load, before the re-plan */}
        <path
          d={paths.requested}
          fill="none"
          stroke={CHART.muted}
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        {/* ---- what actually crosses the meter */}
        <path d={paths.grid} fill="none" stroke={CHART.series} strokeWidth={2} strokeLinejoin="round" />
        {/* ---- any quarter-hour the meter went over the cap */}
        {paths.breach.map((s) => (
          <circle
            key={s}
            cx={xOf(s + 0.5)}
            cy={yOf(plan.grid[s])}
            r={4}
            fill="var(--destructive)"
          />
        ))}

        {/* ---- the cap, and the handle: the same line. Grabbing anything else
                would put a second amber thing on the screen. */}
        <g
          role="slider"
          aria-label="Day-ahead cap"
          aria-valuemin={minMw}
          aria-valuemax={maxMw}
          aria-valuenow={capMw}
          aria-valuetext={`${capMw.toFixed(1)} megawatts`}
          tabIndex={0}
          className="outline-none"
          style={{
            cursor: dragging ? 'grabbing' : 'ns-resize',
            // Without these the press lands on the axis labels instead and the
            // browser starts a text selection, which cancels the drag mid-pull.
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {/* A line 2.5 px wide is not a hit target. This one is, and is invisible. */}
          <path
            d={paths.cap}
            fill="none"
            stroke="transparent"
            strokeWidth={22}
            style={{ pointerEvents: 'stroke' }}
          />
          <path
            d={paths.cap}
            fill="none"
            stroke={CHART.accent}
            strokeWidth={active ? 4 : 2.5}
            style={{ pointerEvents: 'none' }}
          />
          {/* The value, so the presenter can land on a round number while dragging. */}
          <text
            x={W - PAD.r}
            y={capY - 9}
            textAnchor="end"
            fontSize={13}
            fontWeight={600}
            fill={CHART.accent}
            style={{ pointerEvents: 'none' }}
          >
            {capMw.toFixed(1)} MW
          </text>
        </g>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3 text-[12px] text-muted-foreground">
        <LegendItem swatch={<Dash color={CHART.muted} />}>Requested load</LegendItem>
        <LegendItem swatch={<Solid color={CHART.accent} />}>Day-ahead cap - drag it</LegendItem>
        <LegendItem swatch={<Solid color={CHART.series} />}>At the meter</LegendItem>
        <LegendItem swatch={<Block color={CHART.ok} opacity={0.18} />}>
          Battery discharging
        </LegendItem>
        {charging ? (
          <LegendItem swatch={<Block color={CHART.muted} opacity={0.2} />}>
            Battery charging
          </LegendItem>
        ) : null}
        <LegendItem swatch={<Block color={CHART.warn} opacity={0.22} />}>Sessions slowed</LegendItem>
      </div>
    </Surface>
  )
}

function LegendItem({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      {swatch}
      {children}
    </span>
  )
}

const Solid = ({ color }: { color: string }) => (
  <span aria-hidden className="h-[2px] w-5" style={{ background: color }} />
)
const Dash = ({ color }: { color: string }) => (
  <span
    aria-hidden
    className="h-[2px] w-5"
    style={{
      backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 9px)`,
    }}
  />
)
const Block = ({ color, opacity }: { color: string; opacity: number }) => (
  <span
    aria-hidden
    className="h-2.5 w-4 rounded-[2px] border border-border"
    style={{ background: color, opacity: opacity + 0.35 }}
  />
)

export const Timeline = memo(TimelineInner)
