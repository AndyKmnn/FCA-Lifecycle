import { cn } from './cn'

export type LabelKind = 'simulation' | 'proxy' | 'assumption'

const TEXT: Record<LabelKind, string> = {
  simulation: 'Simulation',
  proxy: 'Proxy estimate',
  assumption: 'Assumption',
}

export interface LabelProps {
  kind: LabelKind
  /** Optional extra words, e.g. "illustrative". */
  note?: string
  className?: string
}

/**
 * Required next to every simulated or proxy number on screen.
 * See CLAUDE.md - no unlabelled figures.
 */
export function Label({ kind, note, className }: LabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-surface-sunk nm-pressed',
        'px-3 py-1 text-[11px] font-bold tracking-[0.09em] uppercase text-ink-muted',
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-deep" />
      {TEXT[kind]}
      {note ? <span className="font-semibold normal-case tracking-normal">- {note}</span> : null}
    </span>
  )
}
