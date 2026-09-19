import { motion } from 'framer-motion'
import { CHART, COLORS } from '../design'
import { EASE } from './motion'

/**
 * Decorative grid-node motif for the hero. Purely illustrative - it carries no figures.
 * Every coordinate and delay is a literal, so the animation is identical on every run.
 */

const W = 720
const H = 540

type Node = { id: string; x: number; y: number }

const NODES: readonly Node[] = [
  { id: 'a', x: 96, y: 118 },
  { id: 'b', x: 250, y: 66 },
  { id: 'c', x: 412, y: 134 },
  { id: 'd', x: 596, y: 96 },
  { id: 'e', x: 158, y: 268 },
  { id: 'f', x: 336, y: 236 },
  { id: 'g', x: 524, y: 268 },
  { id: 'h', x: 652, y: 392 },
  { id: 'i', x: 110, y: 426 },
  { id: 'j', x: 286, y: 452 },
  { id: 'k', x: 466, y: 406 },
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
      <defs>
        <radialGradient id="gm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.30" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={SITE.x} cy={SITE.y} r={196} fill="url(#gm-glow)" />

      <g stroke={CHART.grid} strokeWidth={1.75} strokeLinecap="round" fill="none">
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
              r={isSite ? 13 : 7}
              fill={isSite ? COLORS.accent : COLORS.surface}
              stroke={isSite ? COLORS.accentDeep : CHART.muted}
              strokeWidth={isSite ? 2.5 : 1.75}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={isSite ? 13 : 7}
              fill="none"
              stroke={isSite ? COLORS.accentDeep : CHART.muted}
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ scale: [1, 2.5], opacity: [0.45, 0] }}
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
            r={4.5}
            fill={COLORS.accentDeep}
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
