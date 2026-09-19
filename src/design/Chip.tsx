import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  selected?: boolean
  tone?: 'default' | 'accent'
  children?: ReactNode
}

/** Small pill for tags, limit types and scene metadata. */
export function Chip({ selected = false, tone = 'default', className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5',
        'text-[13px] font-semibold tracking-wide',
        selected ? 'nm-pressed' : 'nm-raised-sm',
        tone === 'accent' ? 'bg-accent text-ink' : 'bg-surface text-ink-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
