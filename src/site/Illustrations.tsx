import type { ReactNode } from 'react'
import { CHART, Surface, cn } from '@/design'

/**
 * Small flat UI snippets for the feature cards. They show the shape of a screen,
 * never a figure - there are no numbers here, so there is nothing to mislabel.
 *
 * Charts and maps stay flat (docs/DESIGN_HANDOFF.md): hairline rules, CHART tokens,
 * no shadows and no gradient fills. Brand amber is reserved for the page's call to
 * action, so a limit or a cap - a real signal - is drawn in CHART.warn instead.
 */

const W = 340
const H = 150

/** Caption required on every snippet below. Matches the Label stamp from @/design. */
export function IllustrationTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-sm border border-border bg-muted',
        'py-1 pr-2.5 pl-2 text-muted-foreground micro',
        className,
      )}
    >
      <span aria-hidden className="h-3 w-[3px] rounded-full bg-muted-foreground" />
      Illustration
    </span>
  )
}

function Frame({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <Surface variant="pressed" radius="md" className="p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={caption}>
        {children}
      </svg>
    </Surface>
  )
}

const CAPTION = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  fill: CHART.axis,
} as const

/** Ranked candidate nodes, best first. */
export function NodeRankSnippet() {
  const rows = [
    { name: 'NODE A', width: 228, best: true },
    { name: 'NODE B', width: 170, best: false },
    { name: 'NODE C', width: 116, best: false },
    { name: 'NODE D', width: 66, best: false },
  ]
  return (
    <Frame caption="A ranked list of candidate connection nodes">
      {rows.map((row, i) => {
        const y = 14 + i * 33
        return (
          <g key={row.name}>
            <text x={0} y={y + 11} {...CAPTION}>
              {row.name}
            </text>
            <line
              x1={62}
              y1={y + 7.5}
              x2={314}
              y2={y + 7.5}
              stroke={CHART.grid}
              strokeWidth={1}
            />
            <rect
              x={62}
              y={y}
              width={row.width}
              height={15}
              fill={row.best ? CHART.series : CHART.muted}
            />
          </g>
        )
      })}
    </Frame>
  )
}

/** Load-duration curve with a cap line; the area above the cap is what the cap costs. */
export function CapCostSnippet() {
  const left = 8
  const right = 332
  const top = 16
  const floor = 124
  const cap = 42

  const points = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48
    const value = Math.pow(1 - t, 1.9) * 0.88 + 0.06
    return [left + t * (right - left), floor - value * (floor - top)] as const
  })
  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const clipped = points.filter(([, y]) => y < cap)
  const area =
    clipped.length > 1
      ? `${clipped
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(' ')} L${clipped[clipped.length - 1][0].toFixed(1)} ${cap} L${clipped[0][0].toFixed(1)} ${cap} Z`
      : ''

  return (
    <Frame caption="A load-duration curve with a cap line; the area above the cap is at risk">
      <line x1={left} y1={floor} x2={right} y2={floor} stroke={CHART.grid} strokeWidth={1} />
      {/* Flat hatch, not a gradient: the hours the cap would have cut. */}
      {area ? <path d={area} fill={CHART.warn} fillOpacity={0.18} /> : null}
      <path d={line} fill="none" stroke={CHART.series} strokeWidth={1.5} strokeLinejoin="round" />
      <line
        x1={left}
        y1={cap}
        x2={right}
        y2={cap}
        stroke={CHART.warn}
        strokeWidth={1.25}
        strokeDasharray="5 4"
      />
      <text x={right} y={cap - 7} {...CAPTION} fill={CHART.warn} textAnchor="end">
        CAP
      </text>
      <text x={left} y={floor + 15} {...CAPTION}>
        HOURS OF THE YEAR
      </text>
    </Frame>
  )
}

/** A day-ahead limit as a step line, with the scheduled load kept underneath it. */
export function AutopilotSnippet() {
  const left = 8
  const right = 332
  const floor = 124
  const limit = [
    [left, 46],
    [110, 46],
    [110, 84],
    [212, 84],
    [212, 60],
    [right, 60],
  ] as const
  // The load stays strictly under the limit at every x - that is the whole point of the card.
  const load = [
    [left, 110],
    [46, 94],
    [86, 72],
    [109, 64],
    [113, 98],
    [150, 104],
    [190, 99],
    [211, 96],
    [215, 76],
    [250, 70],
    [292, 77],
    [right, 90],
  ] as const
  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')

  return (
    <Frame caption="A day-ahead limit as a step line with the scheduled load kept underneath">
      <line x1={left} y1={floor} x2={right} y2={floor} stroke={CHART.grid} strokeWidth={1} />
      <path
        d={`${toPath(load)} L${right} ${floor} L${left} ${floor} Z`}
        fill={CHART.series}
        fillOpacity={0.08}
      />
      <path d={toPath(load)} fill="none" stroke={CHART.series} strokeWidth={1.5} strokeLinejoin="round" />
      <path
        d={toPath(limit)}
        fill="none"
        stroke={CHART.warn}
        strokeWidth={1.25}
        strokeDasharray="5 4"
      />
      <text x={left} y={26} {...CAPTION} fill={CHART.warn}>
        DAY-AHEAD LIMIT
      </text>
      <text x={left} y={floor + 15} {...CAPTION}>
        YOUR SCHEDULED LOAD
      </text>
    </Frame>
  )
}
