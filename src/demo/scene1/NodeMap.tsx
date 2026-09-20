import { memo, useMemo } from 'react'
import { CHART } from '../../design'
import { KREISE } from './germanyKreise'
import { effectiveHeadroom, type GridNode } from './siting'

/**
 * One Kreis, filled to the frame, with its substations on it.
 *
 * The third and last step down. Europe answers whether a country is open at
 * all, Germany answers which region can take the load, and this answers the
 * only question left: which connection point, and what is already standing in
 * front of you at it.
 *
 * The frame comes from the outline itself rather than from a stored bounding
 * box. The path is a flat list of alternating coordinates, so its extent is
 * something to read off it, not something to carry beside it and keep in step.
 */

/** Room around the outline, in map units, so it does not touch the edge. */
const PAD = 6

function bboxOf(d: string) {
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
  return { minX, maxX, minY, maxY }
}

export interface NodeMapProps {
  kreisId: string
  nodes: GridNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** Capacity the load needs, MW - decides which nodes are big enough. */
  requiredMw: number
  countQueue: boolean
}

function NodeMapInner({
  kreisId,
  nodes,
  selectedId,
  onSelect,
  requiredMw,
  countQueue,
}: NodeMapProps) {
  const kreis = useMemo(() => KREISE.find((k) => k.id === kreisId), [kreisId])
  const box = useMemo(() => (kreis ? bboxOf(kreis.d) : null), [kreis])

  if (!kreis || !box) return null

  // A node scattered near the edge can sit just outside the outline, so the
  // frame takes the nodes in as well rather than clipping them away.
  const minX = Math.min(box.minX, ...nodes.map((n) => n.nx)) - PAD
  const maxX = Math.max(box.maxX, ...nodes.map((n) => n.nx)) + PAD
  const minY = Math.min(box.minY, ...nodes.map((n) => n.ny)) - PAD
  const maxY = Math.max(box.maxY, ...nodes.map((n) => n.ny)) + PAD
  const w = maxX - minX
  const h = maxY - minY
  /** One map unit in the zoomed frame is this many units of the whole country. */
  const scale = Math.max(w, h) / 120

  return (
    <svg
      viewBox={`${minX} ${minY} ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label={`${kreis.name}, with its connection points`}
    >
      <path
        d={kreis.d}
        fill="var(--muted)"
        fillOpacity={0.5}
        stroke="var(--border)"
        strokeWidth={scale * 0.8}
        strokeLinejoin="round"
      />

      {nodes.map((n) => {
        const room = effectiveHeadroom(n, countQueue)
        const fits = room >= requiredMw
        const selected = n.id === selectedId
        const transmission = n.voltageLevel.startsWith('380')
        const r = (transmission ? 3.4 : 2.4) * scale
        return (
          <g
            key={n.id}
            onClick={() => onSelect(n.id)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={n.name}
          >
            <circle
              cx={n.nx}
              cy={n.ny}
              r={r * (selected ? 1.5 : 1)}
              fill={selected ? CHART.accent : fits ? CHART.ok : 'var(--destructive)'}
              fillOpacity={selected ? 0.95 : 0.75}
              stroke="var(--background)"
              strokeWidth={scale * 0.7}
            />
            <text
              x={n.nx}
              y={n.ny - r * 1.9}
              textAnchor="middle"
              fontSize={4.2 * scale}
              fontWeight={600}
              fill="var(--foreground)"
            >
              {n.name}
            </text>
            <text
              x={n.nx}
              y={n.ny + r * 3.1}
              textAnchor="middle"
              fontSize={3.6 * scale}
              fill="var(--muted-foreground)"
            >
              {room.toFixed(1)} MW · {n.voltageLevel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const NodeMap = memo(NodeMapInner)
