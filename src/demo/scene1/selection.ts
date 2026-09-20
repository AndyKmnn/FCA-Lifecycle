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
