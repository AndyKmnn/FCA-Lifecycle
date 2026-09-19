/**
 * Chart and map colours, as CSS variables from src/design/theme.css.
 * SVG accepts `var(...)`, so Recharts stays on the central palette -
 * change theme.css and the charts change with everything else.
 *
 * Charts and maps stay FLAT: hairline axes, no shadows, no gradients.
 */
export const CHART = {
  series: 'var(--chart-1)',
  accent: 'var(--chart-2)',
  muted: 'var(--chart-3)',
  ok: 'var(--chart-4)',
  warn: 'var(--chart-5)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
} as const

/** Ordered series palette for multi-line charts. */
export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

/** Shared Recharts props so every chart in the demo looks like one instrument. */
export const AXIS_PROPS = {
  stroke: CHART.axis,
  strokeWidth: 1,
  tickLine: false,
  axisLine: { stroke: CHART.grid },
  tick: { fill: CHART.axis, fontSize: 12 },
} as const
