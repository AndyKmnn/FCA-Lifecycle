import { CHART, COLORS, Surface, cn } from '../design'

/**
 * Small flat UI snippets for the feature cards. They show the shape of a screen,
 * never a figure - there are no numbers here, so there is nothing to mislabel.
 * Charts and maps stay flat (see CLAUDE.md); only the frame around them is neumorphic.
 */

const W = 340
const H = 156

/** Caption required on every snippet below. */
export function IllustrationTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-surface-sunk nm-pressed',
        'px-3 py-1 text-[11px] font-bold tracking-[0.09em] uppercase text-ink-muted',
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-deep" />
      Illustration
    </span>
  )
}

export function IllustrationFrame({
  children,
  caption,
}: {
  children: React.ReactNode
  caption: string
}) {
  return (
    <Surface variant="inset" radius="md" className="p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={caption}>
        {children}
      </svg>
    </Surface>
  )
}

/** Ranked candidate nodes, best first. */
export function NodeRankSnippet() {
  const rows = [
    { name: 'Node A', width: 232, best: true },
    { name: 'Node B', width: 174, best: false },
    { name: 'Node C', width: 118, best: false },
    { name: 'Node D', width: 68, best: false },
  ]
  return (
    <IllustrationFrame caption="A ranked list of candidate connection nodes">
      {rows.map((row, i) => {
        const y = 18 + i * 34
        return (
          <g key={row.name}>
            <text x={0} y={y + 13} fontSize={12} fill={CHART.axis} fontWeight={600}>
              {row.name}
            </text>
            <rect x={62} y={y} width={252} height={18} rx={9} fill={COLORS.surface} />
            <rect
              x={62}
              y={y}
              width={row.width}
              height={18}
              rx={9}
              fill={row.best ? COLORS.accent : CHART.muted}
            />
          </g>
        )
      })}
    </IllustrationFrame>
  )
}

/** Load-duration curve with a cap line; the area above the cap is what the cap costs. */
export function CapCostSnippet() {
  const left = 8
  const right = 332
  const top = 14
  const floor = 128
  const cap = 42

  // Deterministic descending curve, sampled once at module evaluation time.
  const points = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48
    const value = Math.pow(1 - t, 1.9) * 0.88 + 0.06
    return [left + t * (right - left), floor - value * (floor - top)] as const
  })
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const clipped = points.filter(([, y]) => y < cap)
  const area =
    clipped.length > 1
      ? `${clipped
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(' ')} L${clipped[clipped.length - 1][0].toFixed(1)} ${cap} L${clipped[0][0].toFixed(1)} ${cap} Z`
      : ''

  return (
    <IllustrationFrame caption="A load-duration curve with a cap line; the area above the cap is at risk">
      <line x1={left} y1={floor} x2={right} y2={floor} stroke={CHART.grid} strokeWidth={1.5} />
      {area ? <path d={area} fill={COLORS.accent} fillOpacity={0.5} /> : null}
      <path d={line} fill="none" stroke={CHART.series} strokeWidth={2.25} strokeLinejoin="round" />
      <line
        x1={left}
        y1={cap}
        x2={right}
        y2={cap}
        stroke={CHART.limit}
        strokeWidth={2}
        strokeDasharray="7 5"
      />
      <text x={right} y={cap - 8} fontSize={11} fontWeight={700} fill={CHART.limit} textAnchor="end">
        CAP
      </text>
      <text x={left} y={floor + 16} fontSize={11} fill={CHART.axis} fontWeight={600}>
        hours of the year
      </text>
    </IllustrationFrame>
  )
}

/** A day-ahead limit as a step line, with the scheduled load kept underneath it. */
export function AutopilotSnippet() {
  const left = 8
  const right = 332
  const floor = 128
  const limit = [
    [left, 48],
    [110, 48],
    [110, 86],
    [212, 86],
    [212, 62],
    [right, 62],
  ] as const
  // The load stays strictly under the limit at every x - that is the whole point of the card.
  const load = [
    [left, 112],
    [46, 96],
    [86, 74],
    [109, 66],
    [113, 100],
    [150, 106],
    [190, 101],
    [211, 98],
    [215, 78],
    [250, 72],
    [292, 79],
    [right, 92],
  ] as const
  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')

  return (
    <IllustrationFrame caption="A day-ahead limit as a step line with the scheduled load kept underneath">
      <line x1={left} y1={floor} x2={right} y2={floor} stroke={CHART.grid} strokeWidth={1.5} />
      <path
        d={`${toPath(load)} L${right} ${floor} L${left} ${floor} Z`}
        fill={CHART.series}
        fillOpacity={0.12}
      />
      <path d={toPath(load)} fill="none" stroke={CHART.series} strokeWidth={2.25} strokeLinejoin="round" />
      <path d={toPath(limit)} fill="none" stroke={CHART.limit} strokeWidth={2.25} strokeDasharray="7 5" />
      <text x={left} y={28} fontSize={11} fontWeight={700} fill={CHART.limit}>
        DAY-AHEAD LIMIT
      </text>
      <text x={left} y={floor + 16} fontSize={11} fill={CHART.axis} fontWeight={600}>
        your scheduled load
      </text>
    </IllustrationFrame>
  )
}
