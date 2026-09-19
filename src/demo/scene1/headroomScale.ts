/**
 * The sequential scale for the headroom choropleth.
 *
 * One hue - the amber from the chart palette - varied by opacity, so the map
 * never introduces a colour of its own. Colour lives in src/design/theme.css.
 */

/** Lightest tint still readable on the page, and full strength at the top. */
const MIN_OPACITY = 0.08
const MAX_OPACITY = 1

export function headroomOpacity(score: number): number {
  const t = Math.min(1, Math.max(0, score / 100))
  return MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * t
}

/** The legend bar: the same ramp, left to right. */
export const HEADROOM_RAMP =
  'linear-gradient(90deg,' +
  ' color-mix(in srgb, var(--chart-2) 8%, var(--muted)),' +
  ' color-mix(in srgb, var(--chart-2) 54%, var(--muted)),' +
  ' var(--chart-2))'
