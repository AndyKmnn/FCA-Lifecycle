import { cn } from './utils'

export interface StepperProps {
  steps: readonly string[]
  current: number
  onSelect?: (index: number) => void
  className?: string
}

/**
 * Scene indicator. A measuring scale: numbered ticks joined by a hairline,
 * the live one filled amber.
 */
export function Stepper({ steps, current, onSelect, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center', className)} aria-label="Demo scenes">
      {steps.map((step, i) => {
        const active = i === current
        const done = i < current
        return (
          <li key={step} className="flex items-center">
            <button
              type="button"
              disabled={!onSelect}
              aria-current={active ? 'step' : undefined}
              onClick={() => onSelect?.(i)}
              className={cn(
                'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors',
                'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                onSelect ? 'hover:bg-muted' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-sm border text-[12px] font-semibold tabular',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : done
                      ? 'border-foreground/25 bg-foreground/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'text-[13px] font-medium whitespace-nowrap transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step}
              </span>
            </button>
            {i < steps.length - 1 ? (
              <span aria-hidden className="mx-1 h-px w-6 bg-border" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
