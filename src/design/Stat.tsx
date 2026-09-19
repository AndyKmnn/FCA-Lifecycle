import type { ReactNode } from 'react'
import { cn } from './cn'
import { Label } from './Label'
import type { LabelKind } from './Label'
import { Surface } from './Surface'

export interface StatProps {
  label: string
  value: ReactNode
  unit?: string
  hint?: string
  /** Every simulated or proxy figure must carry one. */
  tag?: LabelKind
  className?: string
}

export function Stat({ label, value, unit, hint, tag, className }: StatProps) {
  return (
    <Surface radius="md" className={cn('px-6 py-5', className)}>
      <div className="text-[13px] font-semibold tracking-wide uppercase text-ink-muted">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold text-ink tabular-nums">{value}</span>
        {unit ? <span className="text-lg font-semibold text-ink-muted">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1.5 text-sm text-ink-muted">{hint}</div> : null}
      {tag ? <Label kind={tag} className="mt-3" /> : null}
    </Surface>
  )
}
