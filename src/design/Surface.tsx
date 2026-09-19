import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './utils'

export type SurfaceVariant = 'raised' | 'pressed' | 'inset' | 'flat'
export type SurfaceRadius = 'md' | 'lg'

/**
 * One panel, four weights. Hairline borders do the work, not shadows -
 * the surface should read like a milled plate, not a cushion.
 */
const VARIANT: Record<SurfaceVariant, string> = {
  raised: 'bg-card border border-border shadow-xs',
  pressed: 'bg-muted border border-border',
  inset: 'bg-muted border border-border shadow-[inset_0_1px_3px_color-mix(in_oklch,var(--foreground)_8%,transparent)]',
  flat: 'bg-transparent border border-transparent',
}

const RADIUS: Record<SurfaceRadius, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
}

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
  radius?: SurfaceRadius
  children?: ReactNode
}

export function Surface({
  variant = 'raised',
  radius = 'lg',
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <div className={cn(VARIANT[variant], RADIUS[radius], className)} {...rest}>
      {children}
    </div>
  )
}
