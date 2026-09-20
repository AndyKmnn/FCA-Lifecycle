import { operatorAt, type Operator } from './operators'

/**
 * Turning a requirement into a shortlist of places to build.
 *
 * The explorer answers "I have a site, what will it cost me". This answers the
 * question that comes before it and is worth an order of magnitude more: I have
 * a load and no site, where in the country can it actually be plugged in by the
 * date I need it?
 *
 * Three constraints, and each one is a different layer of the data:
 *
 *   the operator - does this one write a flexible connection at all, and does
 *                  its queue clear before the date?
 *   the node     - is there physically enough room at a substation in that
 *                  Kreis, after what is already queued against it?
 *   the year     - both of the above are evaluated as they will stand in the
 *                  year the power is needed, not as they stand today.
 *
 * The third is what makes this different from a filter. A Kreis that cannot
 * take 80 MW today may take it in 2029 because the reinforcement lands, and a
 * shortlist that ignores that is a shortlist of where to build last year.
 */

export interface Requirement {
  /** Capacity the load needs, MW. */
  mw: number
  /** The year power is needed. */
  byYear: number
  /** Curtailment the load can absorb, hours a year. */
  curtailmentHours: number
  /** Count capacity already applied for against the node's free capacity. */
  countQueue: boolean
}

export interface QueueEntry {
  kind: string
  label: string
  mw: number
  filed: string
  speculative: boolean
}

export interface GridNode {
  id: string
  kreisId: string
  name: string
  nx: number
  ny: number
  voltageLevel: string
  headroomMw: number
  queuedMw: number
  queue: QueueEntry[]
}

export interface NodeFile {
  meta: { note: string; count: number; year: number }
  nodes: GridNode[]
}

export const DEFAULT_REQUIREMENT: Requirement = {
  mw: 20,
  byYear: 2029,
  curtailmentHours: 400,
  countQueue: true,
}

/** Free capacity once the applications already filed are counted. */
export function effectiveHeadroom(node: GridNode, countQueue: boolean): number {
  if (!countQueue) return node.headroomMw
  // Speculative filings hold their place but are unlikely to build; counting
  // them at full weight would say the whole country is full, which is the
  // mistake a naive reading of the queue makes.
  const weighted = node.queue.reduce((a, q) => a + q.mw * (q.speculative ? 0.35 : 1), 0)
  return node.headroomMw - weighted
}

export interface Candidate {
  kreisId: string
  operator: Operator
  /** The best node in this Kreis for this requirement. */
  node: GridNode
  headroom: number
  monthsToConnect: number
  /** Why it failed, when it did. */
  blocker: 'none' | 'no-fca' | 'too-slow' | 'no-room' | 'too-curtailed'
}

/**
 * Months available before power is needed.
 *
 * "By 2029" means by the end of 2029, so asking for power in the current year
 * still leaves the rest of it - a budget of zero would rule out the whole
 * country for anyone who needs power this year, which is not a finding, it is
 * an off-by-one.
 */
const monthsUntil = (byYear: number, baseYear: number) =>
  Math.max(0, (byYear - baseYear + 1) * 12)

export function shortlist(
  operators: Operator[],
  nodes: GridNode[],
  req: Requirement,
  baseYear: number,
): { candidates: Candidate[]; passing: Candidate[] } {
  const byKreis = new Map<string, GridNode[]>()
  for (const n of nodes) {
    const list = byKreis.get(n.kreisId)
    if (list) list.push(n)
    else byKreis.set(n.kreisId, [n])
  }

  const budget = monthsUntil(req.byYear, baseYear)

  const candidates = operators.map((base) => {
    const operator = operatorAt(base, req.byYear)
    const here = byKreis.get(base.id) ?? []

    let best: GridNode | null = null
    let bestRoom = -Infinity
    for (const n of here) {
      const room = effectiveHeadroom(n, req.countQueue)
      if (room > bestRoom) {
        bestRoom = room
        best = n
      }
    }

    const blocker: Candidate['blocker'] =
      !operator.offersFca ? 'no-fca'
      : operator.monthsToConnect > budget ? 'too-slow'
      : !best || bestRoom < req.mw ? 'no-room'
      // An operator may reserve the right to curtail for more hours than the
      // load can absorb, which rules the place out however much room it has.
      : operator.maxCurtailmentHours > req.curtailmentHours ? 'too-curtailed'
      : 'none'

    return {
      kreisId: base.id,
      operator,
      node: best as GridNode,
      headroom: bestRoom,
      monthsToConnect: operator.monthsToConnect,
      blocker,
    }
  })

  const passing = candidates
    .filter((c) => c.blocker === 'none')
    .sort(
      (a, b) =>
        a.monthsToConnect - b.monthsToConnect ||
        b.headroom - a.headroom ||
        a.kreisId.localeCompare(b.kreisId),
    )

  return { candidates, passing }
}

/** Where a new application would land in the queue, before and after the reform. */
export function queuePosition(node: GridNode): { today: number; underReform: number } {
  const firm = node.queue.filter((q) => !q.speculative).length
  return { today: node.queue.length + 1, underReform: firm + 1 }
}
