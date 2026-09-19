import type { ReactNode } from 'react'
import { cn } from './utils'

export interface SectionProps {
  /** Wide-tracked caption above the heading, spec-sheet style. */
  eyebrow?: string
  title?: ReactNode
  /** Right-hand slot, e.g. a Label or a Chip. */
  aside?: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * The page's structural unit: a numbered caption, a hairline rule, content.
 * Using it everywhere is what makes the site feel like one instrument.
 */
export function Section({ eyebrow, title, aside, className, children }: SectionProps) {
  return (
    <section className={cn('w-full', className)}>
      {(eyebrow || title || aside) && (
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-5">
          <div>
            {eyebrow ? <span className="micro text-muted-foreground">{eyebrow}</span> : null}
            {title ? (
              <h2 className="mt-2.5 text-[28px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
                {title}
              </h2>
            ) : null}
          </div>
          {aside ? <div className="shrink-0 pb-1">{aside}</div> : null}
        </div>
      )}
      {children}
    </section>
  )
}
