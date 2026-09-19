import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type SurfaceVariant = 'raised' | 'pressed' | 'inset' | 'flat'
export type SurfaceRadius = 'md' | 'lg'

const VARIANT: Record<SurfaceVariant, string> = {
  raised: 'nm-raised bg-surface',
  pressed: 'nm-pressed bg-surface',
  inset: 'nm-inset bg-surface-sunk',
  flat: 'nm-flat bg-surface',
}

const RADIUS: Record<SurfaceRadius, string> = {
  md: 'rounded-[16px]',
  lg: 'rounded-[24px]',
}

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
  radius?: SurfaceRadius
  children?: ReactNode
}

/** The one raised / pressed / inset panel used everywhere. */
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
