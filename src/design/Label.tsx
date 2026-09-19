import { cn } from './utils'

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
 * Required next to every simulated or proxy number on screen (see CLAUDE.md).
 * Styled like the provenance stamp on a calibration certificate: a tick of
 * amber, a hairline box, nothing shouting.
 */
export function Label({ kind, note, className }: LabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-sm border border-border bg-muted',
        'py-1 pr-2.5 pl-2 text-muted-foreground micro',
        className,
      )}
    >
      <span aria-hidden className="h-3 w-[3px] rounded-full bg-primary" />
      {TEXT[kind]}
      {note ? (
        <span className="border-l border-border pl-2 font-medium tracking-normal normal-case">
          {note}
        </span>
      ) : null}
    </span>
  )
}
