import type { Operator } from './operators'

/**
 * The operator the presenter settled on, and the terms they settled on it with.
 *
 * The shell's SceneProps contract carries no payload between scenes and
 * src/shell is frozen, so the choice lives in this tiny module instead. Plain
 * module state - no storage, no clock - so a reload starts clean.
 *
 * It carries the whole operator rather than an id because the terms may have
 * been rewritten in the detail panel, and it is the rewritten ones the term
 * sheet has to print. An id would send the reader back to the file and quietly
 * lose every amendment.
 */
export interface Chosen {
  operator: Operator
  /** True when the presenter changed something the operator had written. */
  amended: boolean
  /** The year the explorer was showing when it was chosen. */
  year: number
}

let chosen: Chosen | null = null

export const setChosen = (next: Chosen | null) => {
  chosen = next
}

export const getChosen = () => chosen

/**
 * What the site finder settled on, read by the terms scene.
 *
 * The two scenes ask different halves of one question - where can this go, and
 * on what terms - so the second opens where the first left off rather than
 * making the presenter find the same Kreis twice on a second map.
 */
export interface Target {
  kreisId: string
  nodeId: string | null
  /** The year the requirement asked for, which the terms are read as of. */
  byYear: number
  /** Capacity the load asked for, MW. */
  mw: number
}

let target: Target | null = null

export const setTarget = (next: Target | null) => {
  target = next
}

export const getTarget = () => target
