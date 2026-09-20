import { memo, useMemo } from 'react'
import { CHART } from '../../design'
import { KREISE, MAP_HEIGHT, MAP_WIDTH } from './germanyKreise'
import type { Operator } from './operators'

/**
 * Germany at Kreis resolution, coloured by how long that operator takes to
 * connect you.
 *
 * The map is tied to the filters beside it: anything the filters exclude drops
 * to a pale outline, so moving a slider redraws the country. That coupling is
 * the whole point - a map that only ever shows the same four colours answers
 * one question once, and this one answers whichever question is being asked.
 *
 * 434 plain paths with a CSS transition, deliberately. Wrapping each in a
 * motion component costs more than the animation is worth at this count.
 *
 * The map takes no height. It scales into whatever box the layout leaves it,
 * because a map that measures itself will sooner or later be taller than the
 * space above the fold - and then it slides out of its own panel.
 */

/** Green inside a year, orange inside two, red beyond. */
const bandOf = (months: number) =>
  months <= 12 ? CHART.ok
  : months <= 24 ? CHART.warn
  : 'var(--destructive)'

export interface KreisMapProps {
  operators: Map<string, Operator>
  /** Ids the filters currently allow through. */
  matched: ReadonlySet<string>
  selectedId: string | null
  onSelect: (id: string) => void
  /** The connection seeker's own site, in map units. */
  site?: { x: number; y: number } | null
  homeId?: string
  /**
   * Overrides the colouring entirely, for callers that score Kreise on
   * something other than how fast the operator connects.
   */
  fills?: Map<string, { fill: string; opacity: number }>
}

function KreisMapInner({
  operators,
  matched,
  selectedId,
  onSelect,
  site,
  homeId,
  fills,
}: KreisMapProps) {
  const shapes = useMemo(
    () =>
      KREISE.map((k) => {
        const op = operators.get(k.id)
        const hit = matched.has(k.id)
        const override = fills?.get(k.id)
        if (override) return { k, hit, fill: override.fill, opacity: override.opacity }
        return {
          k,
          hit,
          fill:
            !op || !hit ? 'var(--muted)'
            : !op.offersFca ? 'var(--muted)'
            : bandOf(op.monthsToConnect),
          opacity: hit ? 0.55 : 0.18,
        }
      }),
    [operators, matched, fills],
  )

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="German Kreise, coloured by how quickly each operator connects"
    >
      {shapes.map(({ k, fill, opacity, hit }) => {
        const selected = k.id === selectedId
        return (
          <path
            key={k.id}
            d={k.d}
            fill={selected ? CHART.accent : fill}
            fillOpacity={selected ? 0.9 : opacity}
            stroke="var(--background)"
            strokeWidth={0.6}
            strokeLinejoin="round"
            onClick={() => onSelect(k.id)}
            style={{ cursor: hit ? 'pointer' : 'default', transition: 'fill-opacity 180ms' }}
          >
            <title>{k.name}</title>
          </path>
        )
      })}

      {/* The Kreis the site sits in, outlined whether or not it passes the filter. */}
      {homeId ? <HomeRing id={homeId} /> : null}

      {site ? (
        <g pointerEvents="none">
          <circle cx={site.x} cy={site.y} r={9} fill={CHART.series} />
          <circle cx={site.x} cy={site.y} r={3.5} fill="var(--background)" />
        </g>
      ) : null}
    </svg>
  )
}

const HomeRing = memo(function HomeRing({ id }: { id: string }) {
  const k = KREISE.find((x) => x.id === id)
  if (!k) return null
  return (
    <path
      d={k.d}
      fill="none"
      stroke={CHART.series}
      strokeWidth={1.6}
      strokeLinejoin="round"
      pointerEvents="none"
    />
  )
})

export const KreisMap = memo(KreisMapInner)
