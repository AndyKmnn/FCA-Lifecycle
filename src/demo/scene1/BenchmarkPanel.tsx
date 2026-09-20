import { useMemo } from 'react'
import { Separator } from '../../design'
import { benchmark, verdict, weakest, type Dimension } from './benchmark'
import type { Operator } from './operators'

/**
 * How this offer compares with every other offer we have seen.
 *
 * A connection seeker holding one offer has no way to judge it: there is no
 * published market, no comparison, and the operator across the table is a
 * regional monopoly. "Is 2.5 MW firm generous or insulting?" is unanswerable
 * from where they sit and trivial from where we sit, and that asymmetry is the
 * product.
 *
 * It benchmarks the terms as they currently stand, amendments included - so
 * pushing the cap up in the panel above moves the marker, and the presenter can
 * find the point where their counterproposal stops being reasonable and starts
 * being a negotiating position.
 */

const TONE: Record<'ok' | 'warn' | 'bad', string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  bad: 'text-destructive',
}

function Bar({ d }: { d: Dimension }) {
  const pct = Math.round(d.percentile * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-foreground">{d.label}</span>
        <span className="tabular text-[12px] text-muted-foreground">
          {d.value.toFixed(d.decimals)} {d.unit}
          <span className="ml-2 font-medium text-foreground">P{pct}</span>
        </span>
      </div>
      <div className="relative mt-1 h-1 rounded-full bg-muted">
        {/* The middle of the comparable set, so the marker has something to be
            left or right of rather than floating on an unlabelled line. */}
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-border" />
        <span
          aria-hidden
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground"
          style={{ left: `${Math.min(98, Math.max(2, pct))}%` }}
        />
      </div>
    </div>
  )
}

export function BenchmarkPanel({
  operator,
  corpus,
}: {
  operator: Operator
  corpus: Operator[]
}) {
  const b = useMemo(() => benchmark(operator, corpus), [operator, corpus])
  if (!b) return null

  const v = verdict(b)
  const w = weakest(b)
  const gap = w.higherIsBetter ? w.median - w.value : w.value - w.median

  return (
    <>
      <Separator className="my-5" />

      <div className="flex items-baseline justify-between gap-3">
        <span className="micro text-muted-foreground">Against the market</span>
        <span className="tabular text-[11px] text-muted-foreground">
          {b.comparable} comparable{b.widened ? '' : ` · ${operator.voltageLevel}`}
        </span>
      </div>

      <p className={`mt-2 text-[14px] leading-snug font-semibold ${TONE[v.tone]}`}>
        {v.headline}
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        {b.dimensions.map((d) => (
          <Bar key={d.key} d={d} />
        ))}
      </div>

      {w.percentile < 0.5 ? (
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
          Push on <span className="font-medium text-foreground">{w.label.toLowerCase()}</span>{' '}
          first: comparable sites get{' '}
          <span className="tabular font-medium text-foreground">
            {w.median.toFixed(w.decimals)} {w.unit}
          </span>
          , which is {Math.abs(gap).toFixed(w.decimals)} {w.unit} better than what is on the
          table.
        </p>
      ) : null}
    </>
  )
}
