import { useMemo } from 'react'
import { CHART } from '../../design'

/**
 * The load duration curve: every quarter-hour of the year, sorted from the
 * highest draw to the lowest.
 *
 * It is the chart the whole product is read off. A flat horizontal line drawn
 * across it is a cap, and the area above that line is what an FCA would curtail
 * - so the shape tells you, before any arithmetic, how much a site gives up by
 * accepting one. A site with a tall thin spike at the left loses almost nothing;
 * a flat one loses a lot.
 *
 * Flat by house rule: hairline stroke, one flat fill, no gradient.
 */

const W = 320
const H = 72
const PAD = 2
/** Enough points to keep the knee of the curve honest, few enough to stay cheap. */
const SAMPLES = 260

export interface LoadCurveProps {
  /** The year of quarter-hour values, MW. */
  values: number[]
  className?: string
}

export function LoadCurve({ values, className }: LoadCurveProps) {
  const { area, line, peak } = useMemo(() => {
    const sorted = Float64Array.from(values).sort()
    const n = sorted.length
    const max = sorted[n - 1] || 1
    const x = (i: number) => PAD + (i / SAMPLES) * (W - PAD * 2)
    const y = (v: number) => PAD + (H - PAD * 2) * (1 - v / max)

    let d = ''
    for (let i = 0; i <= SAMPLES; i++) {
      // Walking the sorted array backwards is what makes it a duration curve.
      const idx = Math.min(n - 1, Math.round((i / SAMPLES) * (n - 1)))
      d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(sorted[n - 1 - idx]).toFixed(1)}`
    }
    return {
      line: d,
      area: `${d}L${x(SAMPLES).toFixed(1)} ${(H - PAD).toFixed(1)}L${x(0).toFixed(1)} ${(H - PAD).toFixed(1)}Z`,
      peak: max,
    }
  }, [values])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Load duration curve, peak ${peak.toFixed(2)} megawatts`}
      preserveAspectRatio="none"
    >
      <path d={area} fill={CHART.series} opacity={0.12} />
      <path d={line} fill="none" stroke={CHART.series} strokeWidth={1.5} />
    </svg>
  )
}
