import { memo } from 'react'
import { Chip, Separator, Surface } from '../../design'
import {
  LIMIT_TYPE_LABEL,
  SORT_LABEL,
  type Filters,
  type LimitType,
  type Operator,
  type SortKey,
} from './operators'

/**
 * The operator database: every Kreis that would write this connection, and the
 * terms it writes.
 *
 * The filters here drive the map beside it as well as this list, so a slider
 * moves both. Sliders are native range inputs tinted to the ink rather than the
 * brand amber - amber on this screen means the selected district and nothing
 * else, and three amber sliders would take that meaning away.
 */

const TYPES: LimitType[] = ['fullyDynamic', 'dynamic', 'static']
const SORTS: SortKey[] = ['months', 'cap', 'firm', 'headroom', 'bkz']

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="micro text-muted-foreground">{label}</span>
        <span className="tabular text-[13px] font-medium text-foreground">
          {value}
          <span className="ml-1 font-mono text-[11px] text-muted-foreground">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer accent-[var(--foreground)]"
      />
    </label>
  )
}

export interface OperatorListProps {
  rows: Operator[]
  total: number
  filters: Filters
  sort: SortKey
  selectedId: string | null
  amendedIds: ReadonlySet<string>
  onFilters: (next: Filters) => void
  onSort: (next: SortKey) => void
  onSelect: (id: string) => void
}

function Row({
  o,
  selected,
  amended,
  onSelect,
}: {
  o: Operator
  selected: boolean
  amended: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(o.id)}
      aria-pressed={selected}
      className={`grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-border px-4 py-3 text-left outline-none last:border-b-0 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 ${
        selected ? 'bg-primary/10' : ''
      }`}
    >
      <span className="truncate text-[14px] font-medium text-foreground">
        {o.kreis}
        {amended ? <span className="ml-2 text-[11px] text-warn">amended</span> : null}
      </span>
      <span className="tabular text-[13px] text-muted-foreground">
        {o.monthsToConnect} mo
      </span>
      <span className="truncate text-[12px] text-muted-foreground">
        {LIMIT_TYPE_LABEL[o.limitType]} &middot; {o.state} &middot; {o.voltageLevel}
      </span>
      <span className="tabular text-[12px] text-muted-foreground">
        {o.capMw.toFixed(1)} / {o.guaranteedMinimumMw.toFixed(1)} MW
      </span>
    </button>
  )
}

function OperatorListInner({
  rows,
  total,
  filters,
  sort,
  selectedId,
  amendedIds,
  onFilters,
  onSort,
  onSelect,
}: OperatorListProps) {
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch })

  const toggleType = (t: LimitType) => {
    const next = new Set(filters.types)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    set({ types: next })
  }

  return (
    <Surface className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
            Operator database
          </h3>
          <span className="tabular text-[13px] text-muted-foreground">
            {rows.length} of {total}
          </span>
        </div>

        <input
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search a Kreis"
          className="mt-3 h-9 w-full rounded-md border border-border bg-background px-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <Chip
              key={t}
              selected={filters.types.has(t)}
              role="button"
              tabIndex={0}
              onClick={() => toggleType(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleType(t)
                }
              }}
              className="cursor-pointer select-none"
            >
              {LIMIT_TYPE_LABEL[t]}
            </Chip>
          ))}
          <Chip
            selected={!filters.offeringOnly}
            role="button"
            tabIndex={0}
            onClick={() => set({ offeringOnly: !filters.offeringOnly })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                set({ offeringOnly: !filters.offeringOnly })
              }
            }}
            className="cursor-pointer select-none"
          >
            Include operators with no FCA
          </Chip>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <Slider
            label="Cap at least"
            value={filters.minCapMw}
            min={0}
            max={6}
            step={0.1}
            unit="MW"
            onChange={(v) => set({ minCapMw: v })}
          />
          <Slider
            label="Firm at least"
            value={filters.minFirmMw}
            min={0}
            max={3}
            step={0.1}
            unit="MW"
            onChange={(v) => set({ minFirmMw: v })}
          />
          <Slider
            label="Connected within"
            value={filters.maxMonths}
            min={6}
            max={60}
            step={1}
            unit="mo"
            onChange={(v) => set({ maxMonths: v })}
          />
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <span className="micro mr-1 text-muted-foreground">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSort(s)}
              aria-pressed={s === sort}
              className={`rounded-md px-2 py-1 text-[12px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                s === sort
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {SORT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <Separator className="shrink-0" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-[14px] text-muted-foreground">
            Nothing matches. Widen the cap or the queue.
          </p>
        ) : (
          rows.map((o) => (
            <Row
              key={o.id}
              o={o}
              selected={o.id === selectedId}
              amended={amendedIds.has(o.id)}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </Surface>
  )
}

export const OperatorList = memo(OperatorListInner)
