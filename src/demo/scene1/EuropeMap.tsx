import { motion } from 'framer-motion'
import { CHART } from '../../design'
import { EUROPE_HEIGHT, EUROPE_PATHS, EUROPE_WIDTH, HOME_COUNTRY } from './europeOutline'

export interface EuropeMapProps {
  height: number
}

/**
 * The opening frame: western and central Europe, with Germany picked out.
 * Flat, one ink, no gradients - the demo zooms straight past it into the
 * district map, so it only has to say "we start at the continent".
 */
export function EuropeMap({ height }: EuropeMapProps) {
  const width = (height * EUROPE_WIDTH) / EUROPE_HEIGHT
  const codes = Object.keys(EUROPE_PATHS)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${EUROPE_WIDTH} ${EUROPE_HEIGHT}`}
      role="img"
      aria-label="Western and central Europe, Germany highlighted"
    >
      {codes.map((code, i) => {
        const home = code === HOME_COUNTRY
        return (
          <motion.path
            key={code}
            d={EUROPE_PATHS[code]}
            stroke="var(--background)"
            strokeWidth={1.25}
            strokeLinejoin="round"
            fill={CHART.series}
            initial={{ opacity: 0, fillOpacity: 0.06 }}
            animate={{ opacity: 1, fillOpacity: home ? 0.55 : 0.09 }}
            transition={{
              opacity: { duration: 0.2, delay: 0.02 + Math.min(i, 24) * 0.004 },
              fillOpacity: { duration: 0.3, delay: home ? 0.26 : 0.08 },
            }}
          />
        )
      })}
    </svg>
  )
}
