import { cn } from './cn'

export interface StepperProps {
  steps: readonly string[]
  current: number
  onSelect?: (index: number) => void
  className?: string
}

/** Scene indicator: 1 - 2 - 3. */
export function Stepper({ steps, current, onSelect, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center gap-3', className)} aria-label="Demo scenes">
      {steps.map((step, i) => {
        const active = i === current
        const done = i < current
        return (
          <li key={step} className="flex items-center gap-3">
            <button
              type="button"
              disabled={!onSelect}
              aria-current={active ? 'step' : undefined}
              onClick={() => onSelect?.(i)}
              className={cn(
                'flex items-center gap-2.5 rounded-full px-4 py-2 transition-all duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-ink',
                active ? 'nm-pressed bg-surface-sunk' : 'nm-raised-sm bg-surface',
                !onSelect && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold',
                  active || done ? 'bg-accent text-ink' : 'bg-surface-sunk text-ink-muted',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'text-[13px] font-semibold',
                  active ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {step}
              </span>
            </button>
            {i < steps.length - 1 ? (
              <span aria-hidden className="h-px w-5 bg-dark-shadow" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
