import { motion } from 'framer-motion'
import { CHART } from '@/design'
import { EASE } from './motion'

/**
 * Decorative grid-node motif for the hero, drawn as an engineering diagram:
 * hairline edges, hollow nodes, no glow and no gradient (see docs/DESIGN_HANDOFF.md).
 * It carries no figures. Every coordinate and delay is a literal, so the animation
 * is identical on every run.
 *
 * Deliberately monochrome: the hero's one amber thing is the call to action.
 */

const W = 720
const H = 520

type Node = { id: string; x: number; y: number }

const NODES: readonly Node[] = [
  { id: 'a', x: 96, y: 112 },
  { id: 'b', x: 250, y: 62 },
  { id: 'c', x: 412, y: 128 },
  { id: 'd', x: 596, y: 92 },
  { id: 'e', x: 158, y: 258 },
  { id: 'f', x: 336, y: 228 },
  { id: 'g', x: 524, y: 258 },
  { id: 'h', x: 652, y: 378 },
  { id: 'i', x: 110, y: 410 },
  { id: 'j', x: 286, y: 436 },
  { id: 'k', x: 466, y: 392 },
]

const AT = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>

const EDGES: readonly [string, string][] = [
  ['a', 'b'],
  ['b', 'c'],
  ['c', 'd'],
  ['a', 'e'],
  ['e', 'f'],
  ['f', 'c'],
  ['c', 'g'],
  ['d', 'g'],
  ['g', 'h'],
  ['e', 'i'],
  ['i', 'j'],
  ['j', 'f'],
  ['j', 'k'],
  ['k', 'g'],
  ['k', 'h'],
]

/** The site: the one node the customer operates. */
const SITE = AT.f

/** Edges a pulse travels along, with the delay that keeps them from firing together. */
const FLOWS: readonly { from: string; to: string; delay: number }[] = [
  { from: 'a', to: 'e', delay: 0 },
  { from: 'e', to: 'f', delay: 0.9 },
  { from: 'c', to: 'g', delay: 1.8 },
  { from: 'j', to: 'k', delay: 2.7 },
  { from: 'k', to: 'g', delay: 3.6 },
  { from: 'b', to: 'c', delay: 4.5 },
]

const FLOW_DURATION = 2.4
const FLOW_CYCLE = 5.4

export function GridMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label="Abstract network of grid nodes"
    >
      {/* Sight lines through the site node, the way a drawing marks a datum. */}
      <g stroke={CHART.grid} strokeWidth={1} strokeDasharray="3 7">
        <line x1={0} y1={SITE.y} x2={W} y2={SITE.y} />
        <line x1={SITE.x} y1={0} x2={SITE.x} y2={H} />
      </g>

      <g stroke={CHART.grid} strokeWidth={1} strokeLinecap="round" fill="none">
        {EDGES.map(([from, to], i) => (
          <motion.line
            key={`${from}-${to}`}
            x1={AT[from].x}
            y1={AT[from].y}
            x2={AT[to].x}
            y2={AT[to].y}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.2 + i * 0.06 }}
          />
        ))}
      </g>

      {NODES.map((node, i) => {
        const isSite = node.id === SITE.id
        return (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.5 + i * 0.07 }}
            style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={isSite ? 9 : 4.5}
              fill={isSite ? CHART.series : 'var(--background)'}
              stroke={isSite ? CHART.series : CHART.muted}
              strokeWidth={1.25}
            />
            {isSite ? (
              <circle
                cx={node.x}
                cy={node.y}
                r={17}
                fill="none"
                stroke={CHART.muted}
                strokeWidth={1}
              />
            ) : null}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={isSite ? 17 : 4.5}
              fill="none"
              stroke={CHART.muted}
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ scale: [1, isSite ? 2 : 3], opacity: [0.5, 0] }}
              transition={{
                duration: isSite ? 2.6 : 3.2,
                ease: 'easeOut',
                repeat: Infinity,
                repeatDelay: isSite ? 0.6 : 1.4,
                delay: 1.2 + i * 0.31,
              }}
              style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
            />
          </motion.g>
        )
      })}

      {FLOWS.map((flow) => {
        const from = AT[flow.from]
        const to = AT[flow.to]
        return (
          <motion.circle
            key={`${flow.from}-${flow.to}-flow`}
            cx={from.x}
            cy={from.y}
            r={3}
            fill={CHART.series}
            initial={{ opacity: 0 }}
            animate={{
              x: [0, to.x - from.x],
              y: [0, to.y - from.y],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: FLOW_DURATION,
              ease: 'linear',
              times: [0, 0.12, 0.88, 1],
              repeat: Infinity,
              repeatDelay: FLOW_CYCLE - FLOW_DURATION,
              delay: 1.4 + flow.delay,
            }}
          />
        )
      })}
    </svg>
  )
}
