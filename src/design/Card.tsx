import type { ReactNode } from 'react'
import { cn } from './cn'
import { Surface } from './Surface'

export interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  footer?: ReactNode
  /** Amber outline for the recommended option. */
  highlight?: boolean
  className?: string
  children?: ReactNode
}

export function Card({
  title,
  subtitle,
  badge,
  footer,
  highlight = false,
  className,
  children,
}: CardProps) {
  return (
    <Surface
      className={cn(
        'flex flex-col p-7',
        highlight && 'outline-2 outline-accent outline-offset-[-2px]',
        className,
      )}
    >
      {(title || badge) && (
        <div className="flex items-start justify-between gap-4">
          {title ? <h3 className="text-xl font-bold text-ink">{title}</h3> : <span />}
          {badge}
        </div>
      )}
      {subtitle ? <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p> : null}
      {children ? <div className="mt-5 flex-1">{children}</div> : null}
      {footer ? <div className="mt-6 pt-5 border-t border-dark-shadow/60">{footer}</div> : null}
    </Surface>
  )
}
