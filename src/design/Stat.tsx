import type { ReactNode } from 'react'
import { Label } from './Label'
import type { LabelKind } from './Label'
import { cn } from './utils'

export interface StatProps {
  label: string
  value: ReactNode
  unit?: string
  hint?: string
  /** Every simulated or proxy figure must carry one. */
  tag?: LabelKind
  className?: string
}

/**
 * An instrument readout: caption, figure, unit. The figure is tabular so a row
 * of Stats lines up on the decimal point.
 */
export function Stat({ label, value, unit, hint, tag, className }: StatProps) {
  return (
    <div
      className={cn(
        'flex min-w-56 flex-col rounded-lg border border-border bg-card px-6 py-5',
        className,
      )}
    >
      <span className="micro text-muted-foreground">{label}</span>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          data-slot="stat-value"
          className="tabular text-[40px] leading-none font-semibold tracking-[-0.02em] text-foreground"
        >
          {value}
        </span>
        {unit ? (
          <span className="font-mono text-sm font-medium text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      {hint ? <span className="mt-2 text-sm text-muted-foreground">{hint}</span> : null}
      {tag ? <Label kind={tag} className="mt-4 self-start" /> : null}
    </div>
  )
}
