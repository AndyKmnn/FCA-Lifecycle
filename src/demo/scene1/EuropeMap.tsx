import { memo, useMemo } from 'react'
import { CHART } from '../../design'
import { EUROPE_HEIGHT, EUROPE_PATHS, EUROPE_WIDTH } from './europeOutline'
import { accessOf, EUROPE_ACCESS, type Access } from './europe'

/**
 * Europe, coloured by whether you can get a connection at all.
 *
 * The only layer of this tool drawn from public record. Grey is not a shade of
 * bad news - it means we have not researched that market, and saying so is what
 * makes the five that are coloured worth believing.
 *
 * Two things this got wrong the first time, both easy to get wrong again. The
 * viewBox is a thousand units across and renders into a pane a few hundred
 * pixels wide, so a stroke of 1 is a sub-pixel hairline: borders have to be
 * given in viewBox units rather than in what looks right written down. And the
 * border was drawn in the background colour, which is invisible against the
 * background. Thirty-three pale countries with no edges between them are one
 * pale shape.
 */

const FILL: Record<Access, string> = {
  closed: 'var(--destructive)',
  constrained: CHART.warn,
  flexible: CHART.ok,
  unassessed: 'var(--muted)',
}

const OPACITY: Record<Access, number> = {
  closed: 0.72,
  constrained: 0.66,
  flexible: 0.62,
  unassessed: 0.5,
}

/** In viewBox units: about two device pixels once scaled into a pane. */
const BORDER = 2.6
const HOME_BORDER = 5

/** Centre of a path's extent - good enough to hang a two-letter label on. */
function centreOf(d: string): { x: number; y: number } | null {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)
  if (!nums || nums.length < 4) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i])
    const y = Number(nums[i + 1])
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/** A bounding-box centre lands in the sea for these three. */
const LABEL_NUDGE: Record<string, { dx: number; dy: number }> = {
  IE: { dx: -8, dy: 0 },
  DK: { dx: 0, dy: -14 },
  NL: { dx: -5, dy: 5 },
}

export interface EuropeMapProps {
  selected: string | null
  onSelect: (code: string) => void
}

function EuropeMapInner({ selected, onSelect }: EuropeMapProps) {
  const labels = useMemo(
    () =>
      Object.keys(EUROPE_ACCESS)
        .map((code) => {
          const c = centreOf(EUROPE_PATHS[code] ?? '')
          if (!c) return null
          const nudge = LABEL_NUDGE[code] ?? { dx: 0, dy: 0 }
          return { code, x: c.x + nudge.dx, y: c.y + nudge.dy }
        })
        .filter((l): l is { code: string; x: number; y: number } => l !== null),
    [],
  )

  return (
    <svg
      viewBox={`0 0 ${EUROPE_WIDTH} ${EUROPE_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="Europe, coloured by connection access"
    >
      {Object.entries(EUROPE_PATHS).map(([code, d]) => {
        const a = accessOf(code)
        const isSelected = code === selected
        const known = a.access !== 'unassessed'
        return (
          <path
            key={code}
            d={d}
            fill={isSelected ? CHART.accent : FILL[a.access]}
            fillOpacity={isSelected ? 0.92 : OPACITY[a.access]}
            stroke="var(--border)"
            strokeWidth={BORDER}
            strokeLinejoin="round"
            onClick={() => onSelect(code)}
            style={{ cursor: known ? 'pointer' : 'default', transition: 'fill-opacity 180ms' }}
          >
            <title>{`${a.name} - ${a.headline}`}</title>
          </path>
        )
      })}

      {/* The one country this map is a doorway into, outlined so it reads as one. */}
      <path
        d={EUROPE_PATHS.DE}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={HOME_BORDER}
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {labels.map((l) => (
        <text
          key={l.code}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fontSize={26}
          fontWeight={700}
          fill="var(--foreground)"
          stroke="var(--background)"
          strokeWidth={5}
          paintOrder="stroke"
          pointerEvents="none"
        >
          {l.code}
        </text>
      ))}
    </svg>
  )
}

export const EuropeMap = memo(EuropeMapInner)
