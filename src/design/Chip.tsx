import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from './ui/badge'
import { cn } from './utils'

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  selected?: boolean
  tone?: 'default' | 'accent'
  children?: ReactNode
}

/** Small pill for tags, limit types and scene metadata. */
export function Chip({ selected = false, tone = 'default', className, children, ...rest }: ChipProps) {
  return (
    <Badge
      variant={tone === 'accent' ? 'default' : 'outline'}
      className={cn(
        'h-7 rounded-md px-2.5 text-[12px] font-medium tracking-tight',
        tone === 'default' && 'bg-card text-muted-foreground',
        selected && 'border-primary/60 bg-primary/10 text-foreground',
        className,
      )}
      {...rest}
    >
      {children}
    </Badge>
  )
}
