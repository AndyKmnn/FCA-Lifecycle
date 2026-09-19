import { motion } from 'framer-motion'
import type { Regions } from '../../data'
import { CHART } from '../../design'
import { MAP_HEIGHT, MAP_WIDTH, STATE_PATHS, project } from './germanyStates'
import { headroomOpacity } from './headroomScale'

export interface HeadroomMapProps {
  data: Regions
  /** Called when the presenter clicks the pulsing site pin. */
  onPinClick: () => void
  height: number
}

/**
 * Germany's federal states, flat by design - the handoff keeps charts and maps
 * free of shadows and gradients. Hairline borders, one hue, opacity carries
 * the proxy headroom score.
 */
export function HeadroomMap({ data, onPinClick, height }: HeadroomMapProps) {
  const width = (height * MAP_WIDTH) / MAP_HEIGHT
  const site = project(data.site.lon, data.site.lat)
  const highlight = data.site.state

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="Proxy headroom score by German federal state"
    >
      <g>
        {data.regions.map((region, i) => (
          <motion.path
            key={region.code}
            d={STATE_PATHS[region.code]}
            fill={CHART.accent}
            stroke="var(--background)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            initial={{ opacity: 0, fillOpacity: 0.04 }}
            animate={{ opacity: 1, fillOpacity: headroomOpacity(region.headroomScore) }}
            transition={{
              opacity: { duration: 0.35, delay: 0.15 + i * 0.045 },
              fillOpacity: { duration: 0.6, delay: 0.35 + i * 0.045 },
            }}
          />
        ))}

        {/* Bavaria lights up: a navy hairline drawn on top once the wash lands. */}
        <motion.path
          d={STATE_PATHS[highlight]}
          fill="none"
          stroke={CHART.series}
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1] }}
          transition={{ duration: 1.4, delay: 1.5, times: [0, 0.35, 0.7, 1] }}
        />
      </g>

      {/* Site pin - the one amber signal on this screen. Click to continue. */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: `${site.x}px`, originY: `${site.y}px`, cursor: 'pointer' }}
        onClick={onPinClick}
        role="button"
        tabIndex={0}
        aria-label={`${data.site.name}, ${data.site.stateName} - continue`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onPinClick()
          }
        }}
      >
        {[2.4, 3.4].map((delay) => (
          <motion.circle
            key={delay}
            cx={site.x}
            cy={site.y}
            fill="none"
            stroke={CHART.series}
            strokeWidth={1.5}
            initial={{ r: 12, opacity: 0 }}
            animate={{ r: [12, 40], opacity: [0.6, 0] }}
            transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <circle cx={site.x} cy={site.y} r={11} fill={CHART.series} />
        <circle cx={site.x} cy={site.y} r={4.5} fill={CHART.accent} />
        {/* Transparent, generous hit area. */}
        <circle cx={site.x} cy={site.y} r={32} fill="transparent" />
      </motion.g>
    </svg>
  )
}
