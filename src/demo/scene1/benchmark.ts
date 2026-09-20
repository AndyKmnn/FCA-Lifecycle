import type { Operator } from './operators'

/**
 * Where one operator's offer sits against everything comparable.
 *
 * This is the screen that changes the conversation. A connection seeker with
 * one offer in front of them has no way to know whether 2.5 MW firm is generous
 * or insulting - there is no published market, no comparison, and the operator
 * they are talking to is a monopoly. The answer is only visible from a position
 * that has seen many offers, which is the position this venture is built to
 * occupy.
 *
 * Comparable means the same voltage level, because a medium-voltage offer and a
 * high-voltage one are not the same product. If that leaves too small a set to
 * say anything, it widens to every operator that writes an FCA at all rather
 * than quoting a percentile out of nine.
 */

/** Below this many comparables, a percentile is noise dressed as a finding. */
const MIN_COMPARABLE = 30

export interface Dimension {
  key: string
  label: string
  value: number
  unit: string
  decimals: number
  /** 0 = worse than everything comparable, 1 = better than everything. */
  percentile: number
  median: number
  higherIsBetter: boolean
}

export interface Benchmark {
  dimensions: Dimension[]
  /** Mean of the dimensions, 0-1. */
  overall: number
  comparable: number
  /** True when the comparison had to widen past voltage level to say anything. */
  widened: boolean
}

/**
 * The share of the set this value beats, from the customer's point of view.
 *
 * Ties count half. Counting only strict wins sounds right and is not: with 362
 * operators and whole-month connection times, 33 of them sit on exactly 14
 * months, so an offer *on* the median scored P46 and the median offer in the
 * whole corpus was announced as "better than 47%". An offer that matches the
 * market should read as the middle of it.
 */
function percentileOf(values: number[], value: number, higherIsBetter: boolean): number {
  if (values.length === 0) return 0.5
  let better = 0
  let equal = 0
  for (const v of values) {
    if (v === value) equal++
    else if (higherIsBetter ? value > v : value < v) better++
  }
  return (better + equal / 2) / values.length
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const SPEC: Array<{
  key: keyof Operator & string
  label: string
  unit: string
  decimals: number
  higherIsBetter: boolean
}> = [
  // The one term that decides whether the site can operate at all.
  { key: 'guaranteedMinimumMw', label: 'Guaranteed firm', unit: 'MW', decimals: 1, higherIsBetter: true },
  { key: 'capMw', label: 'Cap', unit: 'MW', decimals: 1, higherIsBetter: true },
  // A ceiling limits how much the operator may take; a lower one protects you.
  { key: 'maxCurtailmentHours', label: 'Curtailment ceiling', unit: 'h/yr', decimals: 0, higherIsBetter: false },
  { key: 'bkzEurPerKw', label: 'Connection charge', unit: 'EUR/kW', decimals: 0, higherIsBetter: false },
  { key: 'monthsToConnect', label: 'Time to connect', unit: 'months', decimals: 0, higherIsBetter: false },
]

export function benchmark(subject: Operator, corpus: Operator[]): Benchmark | null {
  if (!subject.offersFca) return null

  const offering = corpus.filter((o) => o.offersFca && o.id !== subject.id)
  let peers = offering.filter((o) => o.voltageLevel === subject.voltageLevel)
  const widened = peers.length < MIN_COMPARABLE
  if (widened) peers = offering
  if (peers.length === 0) return null

  const dimensions = SPEC.map((spec) => {
    const values = peers.map((o) => o[spec.key] as number)
    const value = subject[spec.key] as number
    return {
      key: spec.key,
      label: spec.label,
      unit: spec.unit,
      decimals: spec.decimals,
      value,
      median: median(values),
      higherIsBetter: spec.higherIsBetter,
      percentile: percentileOf(values, value, spec.higherIsBetter),
    }
  })

  return {
    dimensions,
    overall: dimensions.reduce((a, d) => a + d.percentile, 0) / dimensions.length,
    comparable: peers.length,
    widened,
  }
}

/**
 * The one line the customer repeats back to the operator.
 *
 * Every branch states the same thing - the share of comparable offers this one
 * beats. The weak branch used to say "Bottom 39%", which is the share it beats
 * read as the share it sits within: an offer better than 39% of the market is
 * in the bottom 61%, not the bottom 39%. Two readings of one number in three
 * branches is how that kind of mistake survives review.
 */
export function verdict(b: Benchmark): { tone: 'ok' | 'warn' | 'bad'; headline: string } {
  const pct = Math.round(b.overall * 100)
  if (pct >= 70) return { tone: 'ok', headline: `Better than ${pct}% of comparable offers.` }
  if (pct >= 40)
    return { tone: 'warn', headline: `Middling: better than ${pct}% of comparable offers.` }
  return { tone: 'bad', headline: `Weak: better than only ${pct}% of comparable offers.` }
}

/**
 * The single dimension most worth pushing back on.
 *
 * Only terms that are actually behind the market qualify. The lowest percentile
 * on its own can be a term sitting exactly on the median once ties are
 * frequent, and telling a presenter to push for an improvement of nought is
 * worse than saying nothing.
 */
export function weakest(b: Benchmark): Dimension | null {
  const behind = b.dimensions.filter(
    (d) => d.percentile < 0.5 && Math.abs(d.value - d.median) > 1e-9,
  )
  if (behind.length === 0) return null
  return behind.reduce((a, d) => (d.percentile < a.percentile ? d : a))
}
