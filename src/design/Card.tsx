import type { ReactNode } from 'react'
import { Card as UICard, CardContent, CardFooter, CardHeader } from './ui/card'
import { cn } from './utils'

export interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  footer?: ReactNode
  /** Marks the recommended option: an amber rule along the top edge. */
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
    <UICard
      className={cn(
        'relative gap-0 overflow-hidden rounded-lg border-border py-0 shadow-xs',
        highlight && 'border-primary/50',
        className,
      )}
    >
      {highlight ? (
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
      ) : null}

      {(title || badge) && (
        <CardHeader className="flex items-start justify-between gap-4 border-b border-border px-6 pt-6 pb-5 [.border-b]:pb-5">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-lg leading-tight font-semibold tracking-[-0.01em] text-foreground">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </CardHeader>
      )}

      {children ? <CardContent className="px-6 py-6">{children}</CardContent> : null}

      {footer ? (
        <CardFooter className="mt-auto border-t border-border bg-muted/50 px-6 py-4">
          {footer}
        </CardFooter>
      ) : null}
    </UICard>
  )
}
