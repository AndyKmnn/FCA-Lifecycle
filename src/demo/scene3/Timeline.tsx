import { memo, useEffect, useId, useMemo, useRef } from 'react'
import { CHART, Label, Surface } from '../../design'
import type { Frame } from './useReplay'
import { STEPS_PER_DAY, type DayPlan } from './replan'

/**
 * The day's schedule, drawn as flat SVG - hairline axes, no shadows, no fills
 * with a gradient in them.
 *
 * Amber means one thing on this screen: the day-ahead limit. The cap line and
 * the window it applies to are amber; every other series is navy, grey or a
 * signal colour, so the eye goes to the limit and to what the site does about it.
 *
 * A quiet day is drawn whole, so the year fast-forwards as a flipbook rather than
 * a strobe; a day with a limit is swept in from the left, which is what makes the
 * re-plan readable. The sweep is a clip rectangle whose width is written straight
 * to the DOM from the replay clock, so it runs at 60 fps without re-rendering.
 */

const W = 960
const H = 452
const PAD = { l: 54, r: 18, t: 18, b: 34 }
const PLOT_W = W - PAD.l - PAD.r
const PLOT_H = H - PAD.t - PAD.b
const Y_MAX = 6.4

const xOf = (step: number) => PAD.l + (step / STEPS_PER_DAY) * PLOT_W
const yOf = (mw: number) => PAD.t + PLOT_H - (Math.max(0, mw) / Y_MAX) * PLOT_H

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
  subscribe: (fn: (f: Frame) => void) => () => void
  frame: () => Frame
}

function TimelineInner({ plan, subscribe, frame }: TimelineProps) {
  const clipId = useId()
  const revealRef = useRef<SVGRectElement>(null)
  const nowRef = useRef<SVGGElement>(null)

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

  const sweep = plan.constrained
  useEffect(() => {
    const paint = (f: Frame) => {
      const progress = sweep ? f.dayProgress : 1
      revealRef.current?.setAttribute('width', String(PAD.l + PLOT_W * progress))
      nowRef.current?.setAttribute('transform', `translate(${xOf(progress * STEPS_PER_DAY)} 0)`)
      nowRef.current?.setAttribute('opacity', sweep && progress < 1 ? '1' : '0')
    }
    paint(frame())
    return subscribe(paint)
  }, [subscribe, frame, sweep])

  const charging = plan.chargedMwh > 0.01

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
        <Label kind="simulation" className="shrink-0" />
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full flex-1"
        role="img"
        aria-label={`Schedule for ${plan.date}`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect ref={revealRef} x="0" y="0" width={PAD.l} height={H} />
          </clipPath>
        </defs>

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

        <g clipPath={`url(#${clipId})`}>
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
          <path
            d={paths.grid}
            fill="none"
            stroke={CHART.series}
            strokeWidth={2}
            strokeLinejoin="round"
          />
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
        </g>

        {/* ---- the cap: drawn in full the moment the limit arrives */}
        <path d={paths.cap} fill="none" stroke={CHART.accent} strokeWidth={2.5} />

        {/* ---- the playhead, shown only while a re-plan is sweeping in */}
        <g ref={nowRef} opacity={0}>
          <line x1={0} x2={0} y1={PAD.t} y2={PAD.t + PLOT_H} stroke={CHART.axis} strokeWidth={1} />
        </g>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3 text-[12px] text-muted-foreground">
        <LegendItem swatch={<Dash color={CHART.muted} />}>Requested load</LegendItem>
        <LegendItem swatch={<Solid color={CHART.accent} />}>Day-ahead cap</LegendItem>
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
