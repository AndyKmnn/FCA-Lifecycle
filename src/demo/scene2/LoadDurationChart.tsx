import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { AXIS_PROPS, CHART } from '../../design'
import type { LdcPoint } from './compute'

export interface LoadDurationChartProps {
  data: LdcPoint[]
  connectionMw: number
  staticCapMw: number
  /** Held back until the curve's beat in the scene. */
  play: boolean
}

const LABEL = { fontSize: 12, fontWeight: 500 }

/** Flat by design: hairline axes, no shadows, no gradient fills. */
export function LoadDurationChart({ data, connectionMw, staticCapMw, play }: LoadDurationChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={play ? data : []} margin={{ top: 14, right: 16, bottom: 6, left: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          {...AXIS_PROPS}
          dataKey="pct"
          type="number"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v: number) => `${v}%`}
          height={48}
          label={{
            value: 'Share of the year at or above this load',
            position: 'insideBottom',
            offset: -4,
            fill: CHART.axis,
            ...LABEL,
          }}
        />
        <YAxis
          {...AXIS_PROPS}
          domain={[0, connectionMw]}
          ticks={[0, 1, 2, 3, 4, 5, 6]}
          tickFormatter={(v: number) => `${v} MW`}
          width={66}
        />
        <ReferenceLine
          y={connectionMw}
          stroke={CHART.muted}
          strokeDasharray="4 4"
          label={{
            value: `Connection ${connectionMw} MW`,
            position: 'insideTopRight',
            fill: CHART.axis,
            ...LABEL,
          }}
        />
        <ReferenceLine
          y={staticCapMw}
          stroke={CHART.warn}
          label={{
            value: `Static cap ${staticCapMw.toFixed(1)} MW`,
            position: 'insideTopRight',
            fill: CHART.warn,
            ...LABEL,
          }}
        />
        <Area
          type="monotone"
          dataKey="mw"
          stroke={CHART.series}
          strokeWidth={2}
          fill={CHART.series}
          fillOpacity={0.07}
          dot={false}
          isAnimationActive
          animationDuration={2600}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
