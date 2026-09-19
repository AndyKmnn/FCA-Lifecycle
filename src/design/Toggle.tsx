import { motion } from 'framer-motion'
import { cn } from './cn'

export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

/** Inset track, raised knob. */
export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <label className={cn('inline-flex items-center gap-3 select-none', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-9 w-16 shrink-0 rounded-full nm-pressed transition-colors duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          checked ? 'bg-accent' : 'bg-surface-sunk',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        <motion.span
          className="absolute top-1 left-1 h-7 w-7 rounded-full bg-surface nm-raised-sm"
          animate={{ x: checked ? 28 : 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        />
      </button>
      {label ? <span className="text-[15px] font-medium text-ink">{label}</span> : null}
    </label>
  )
}
