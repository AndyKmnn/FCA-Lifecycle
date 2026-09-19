/** Design tokens mirrored from src/index.css, for charts and inline styles. */
export const COLORS = {
  surface: '#E6EBF2',
  surfaceSunk: '#DDE3EC',
  lightShadow: '#FFFFFF',
  darkShadow: '#C3CAD6',
  accent: '#F5A623',
  accentDeep: '#B06F00',
  ink: '#0E1B3A',
  inkMuted: '#47536E',
  ok: '#17795E',
  warn: '#A4451A',
} as const

export const RADIUS = { nm: 16, nmLg: 24 } as const

/** Flat palette for charts and maps - charts are never neumorphic. */
export const CHART = {
  grid: '#C8D0DC',
  axis: '#47536E',
  series: '#0E1B3A',
  limit: '#B06F00',
  fill: '#F5A623',
  muted: '#8C97AE',
} as const
