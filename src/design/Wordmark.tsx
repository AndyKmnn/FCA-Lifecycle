import { BRAND } from './brand'
import { cn } from './utils'

/** The mark: a milled navy plate with the amber bolt, plus the wordmark. */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-md bg-foreground"
      >
        <svg viewBox="0 0 32 32" className="size-[18px]" aria-hidden>
          <path d="M18.5 4 9 18h6l-1.5 10L23 14h-6l1.5-10z" fill="var(--primary)" />
        </svg>
      </span>
      {compact ? null : (
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
          {BRAND.name}
        </span>
      )}
    </span>
  )
}
