import { motion } from 'framer-motion'
import type { District, Districts, Regions } from '../../data'
import { CHART } from '../../design'
import { MAP_HEIGHT, MAP_WIDTH, STATE_PATHS, project } from './germanyStates'

/**
 * Germany's federal states, grouped into grid operator districts.
 *
 * Flat by design. Districts are told apart by tint of one ink, so amber stays
 * free to mark the single thing that matters: the district the presenter picks.
 */
const TINTS = [0.1, 0.22, 0.34, 0.46]

export interface DistrictMapProps {
  regions: Regions
  districts: Districts
  /** Revealed once the map has settled. */
  showLabels: boolean
  selectedId: string | null
  onSelect: (district: District) => void
  height: number
}

export function DistrictMap({
  regions,
  districts,
  showLabels,
  selectedId,
  onSelect,
  height,
}: DistrictMapProps) {
  const width = (height * MAP_WIDTH) / MAP_HEIGHT
  const site = project(regions.site.lon, regions.site.lat)

  /** A district's label sits at the mean of its states' centroids. */
  const centroid = (d: District) => {
    const pts = d.states
      .map((code) => regions.regions.find((r) => r.code === code))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => project(r.lon, r.lat))
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length
    const y = pts.reduce((a, p) => a + p.y, 0) / pts.length
    return { x, y }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="German federal states grouped into grid operator districts"
    >
      {districts.districts.map((d, i) => {
        const selected = d.id === selectedId
        return (
          <motion.g
            key={d.id}
            role="button"
            tabIndex={showLabels ? 0 : -1}
            aria-label={`${d.name}, connects in ${d.monthsToConnect} months`}
            style={{ cursor: showLabels ? 'pointer' : 'default' }}
            onClick={() => showLabels && onSelect(d)}
            onKeyDown={(e) => {
              if (showLabels && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onSelect(d)
              }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
          >
            {d.states.map((code) => (
              <motion.path
                key={code}
                d={STATE_PATHS[code]}
                stroke="var(--background)"
                strokeWidth={1.25}
                strokeLinejoin="round"
                animate={{
                  fill: selected ? CHART.accent : CHART.series,
                  fillOpacity: selected ? 0.85 : TINTS[i % TINTS.length],
                }}
                transition={{ duration: 0.35 }}
              />
            ))}
          </motion.g>
        )
      })}

      {showLabels &&
        districts.districts.map((d, i) => {
          const c = centroid(d)
          const selected = d.id === selectedId
          return (
            <motion.g
              key={`label-${d.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.5 + i * 0.1 }}
              style={{ pointerEvents: 'none' }}
            >
              <text
                x={c.x}
                y={c.y - 8}
                textAnchor="middle"
                fontSize={22}
                fontWeight={600}
                fill={selected ? 'var(--primary-foreground)' : 'var(--foreground)'}
              >
                {d.name}
              </text>
              <text
                x={c.x}
                y={c.y + 18}
                textAnchor="middle"
                fontSize={19}
                fill={selected ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}
              >
                {d.monthsToConnect} months to connect
              </text>
            </motion.g>
          )
        })}

      {/* The site the profile was uploaded for. */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
        style={{ originX: `${site.x}px`, originY: `${site.y}px`, pointerEvents: 'none' }}
      >
        <circle cx={site.x} cy={site.y} r={10} fill={CHART.series} />
        <circle cx={site.x} cy={site.y} r={4} fill="var(--background)" />
      </motion.g>
    </svg>
  )
}
