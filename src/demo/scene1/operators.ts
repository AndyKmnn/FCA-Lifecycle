/**
 * The operator database behind the connection explorer.
 *
 * One entry per Kreis - 434 of them - carrying the terms that operator would
 * write. Lives in this scene's folder rather than src/data because nothing else
 * uses it, and src/data is shared and frozen.
 *
 * Terms are constructed; see make-germany-kreise.mjs for how and why.
 */

export type LimitType = 'fullyDynamic' | 'dynamic' | 'static' | 'none'

export interface Operator {
  id: string
  /** Regional name, e.g. "Netz Landkreis Freising". Not a real company. */
  name: string
  kreis: string
  state: string
  urban: boolean
  offersFca: boolean
  limitType: LimitType
  /** The ceiling this operator would write, MW. */
  capMw: number
  /** Draw below this is never curtailed, MW. */
  guaranteedMinimumMw: number
  monthsToConnect: number
  monthsToFirm: number
  noticePeriod: string
  /** Contractual ceiling on curtailment, hours per year. */
  maxCurtailmentHours: number
  /** Whether the operator pays for curtailment above the firm level. */
  compensationAboveCap: boolean
  /** Baukostenzuschuss, euros per kW of connection capacity. */
  bkzEurPerKw: number
  voltageLevel: string
  /** Free capacity at the node, MW - a proxy, not a measurement. */
  headroomMw: number
  /** How far along this operator is with low-voltage monitoring, 0-100. */
  digitalisation: number
}

export interface OperatorFile {
  meta: { note: string; year: number; requestedMw: number; count: number; homeId: string }
  operators: Operator[]
}

/** The terms the presenter has typed over the top, per operator id. */
export type Amendments = ReadonlyMap<string, Partial<Operator>>

/** An operator with any amendment applied. */
export function withAmendment(o: Operator, amendments: Amendments): Operator {
  const patch = amendments.get(o.id)
  return patch ? { ...o, ...patch } : o
}

export const LIMIT_TYPE_LABEL: Record<LimitType, string> = {
  fullyDynamic: 'Fully dynamic',
  dynamic: 'Seasonal',
  static: 'Static',
  none: 'No FCA',
}

/** Months skipped by taking the flexible connection instead of waiting. */
export const monthsSkipped = (o: Operator) => Math.max(0, o.monthsToFirm - o.monthsToConnect)

export interface Filters {
  query: string
  types: ReadonlySet<LimitType>
  /** Only operators whose cap is at least this, MW. */
  minCapMw: number
  /** Only operators whose guaranteed firm level is at least this, MW. */
  minFirmMw: number
  /** Only operators that would connect within this many months. */
  maxMonths: number
  /** Hide the operators that do not offer an FCA at all. */
  offeringOnly: boolean
}

export type SortKey = 'months' | 'cap' | 'firm' | 'headroom' | 'bkz'

export const SORT_LABEL: Record<SortKey, string> = {
  months: 'Fastest',
  cap: 'Highest cap',
  firm: 'Most firm',
  headroom: 'Most headroom',
  bkz: 'Cheapest BKZ',
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  types: new Set<LimitType>(['fullyDynamic', 'dynamic', 'static']),
  minCapMw: 0,
  minFirmMw: 0,
  maxMonths: 60,
  offeringOnly: true,
}

export function applyFilters(
  operators: Operator[],
  f: Filters,
  sort: SortKey,
  amendments: Amendments,
): Operator[] {
  const q = f.query.trim().toLowerCase()
  const out = operators
    .map((o) => withAmendment(o, amendments))
    .filter((o) => {
      // An operator that writes no FCA has no limit type to match, so the type
      // chips must not be what excludes it - otherwise asking to see them does
      // nothing, which is how this was wrong the first time.
      if (!o.offersFca) {
        if (f.offeringOnly) return false
      } else if (!f.types.has(o.limitType)) {
        return false
      }
      if (o.capMw < f.minCapMw) return false
      if (o.guaranteedMinimumMw < f.minFirmMw) return false
      if (o.monthsToConnect > f.maxMonths) return false
      if (q && !o.kreis.toLowerCase().includes(q) && !o.name.toLowerCase().includes(q))
        return false
      return true
    })

  const by: Record<SortKey, (a: Operator, b: Operator) => number> = {
    months: (a, b) => a.monthsToConnect - b.monthsToConnect,
    cap: (a, b) => b.capMw - a.capMw,
    firm: (a, b) => b.guaranteedMinimumMw - a.guaranteedMinimumMw,
    headroom: (a, b) => b.headroomMw - a.headroomMw,
    bkz: (a, b) => a.bkzEurPerKw - b.bkzEurPerKw,
  }
  // Kreis name breaks every tie, so the order never depends on file order.
  return out.sort((a, b) => by[sort](a, b) || a.kreis.localeCompare(b.kreis))
}

export async function loadOperators(): Promise<OperatorFile> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/operators.json`)
  if (!res.ok) throw new Error(`operators.json: ${res.status}`)
  return (await res.json()) as OperatorFile
}
