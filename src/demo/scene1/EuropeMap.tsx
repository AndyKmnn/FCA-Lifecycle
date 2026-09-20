import { memo } from 'react'
import { CHART } from '../../design'
import { EUROPE_HEIGHT, EUROPE_PATHS, EUROPE_WIDTH } from './europeOutline'
import { accessOf, type Access } from './europe'

/**
 * Europe, coloured by whether you can get a connection at all.
 *
 * The only layer of this tool drawn from public record. Grey is not a shade of
 * bad news - it means we have not researched that market, and saying so is what
 * makes the four countries that are coloured worth believing.
 */

const FILL: Record<Access, string> = {
  closed: 'var(--destructive)',
  constrained: CHART.warn,
  flexible: CHART.ok,
  unassessed: 'var(--muted)',
}

const OPACITY: Record<Access, number> = {
  closed: 0.6,
  constrained: 0.55,
  flexible: 0.5,
  unassessed: 0.35,
}

export interface EuropeMapProps {
  selected: string | null
  onSelect: (code: string) => void
}

function EuropeMapInner({ selected, onSelect }: EuropeMapProps) {
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
            fillOpacity={isSelected ? 0.9 : OPACITY[a.access]}
            stroke="var(--background)"
            strokeWidth={1}
            strokeLinejoin="round"
            onClick={() => onSelect(code)}
            style={{ cursor: known ? 'pointer' : 'default', transition: 'fill-opacity 180ms' }}
          >
            <title>{`${a.name} - ${a.headline}`}</title>
          </path>
        )
      })}
    </svg>
  )
}

export const EuropeMap = memo(EuropeMapInner)
