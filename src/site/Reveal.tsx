import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { riseIn, stagger, TRANSITION, VIEWPORT } from './motion'

export interface RevealProps {
  children: ReactNode
  className?: string
  /** Extra delay, in seconds, on top of the parent's stagger. */
  delay?: number
  as?: 'div' | 'section' | 'li'
}

/** Scroll-triggered fade-up. Plays once, when a quarter of the block is in view. */
export function Reveal({ children, className, delay = 0, as = 'div' }: RevealProps) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={riseIn}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
      transition={delay ? { ...TRANSITION, delay } : undefined}
    >
      {children}
    </Tag>
  )
}

export interface RevealGroupProps {
  children: ReactNode
  className?: string
  step?: number
  delay?: number
  as?: 'div' | 'section' | 'ul'
}

/**
 * Reveals its <Reveal> children in sequence. The children keep `initial`/`whileInView`
 * off and inherit "hidden"/"shown" from here.
 */
export function RevealGroup({
  children,
  className,
  step,
  delay,
  as = 'div',
}: RevealGroupProps) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={stagger(step, delay)}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {children}
    </Tag>
  )
}

/** A child of RevealGroup: inherits the group's state instead of watching the viewport. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  // Never give this a `display: contents` class - a transform cannot be applied to it.
  const Tag = motion[as]
  return (
    <Tag className={className} variants={riseIn}>
      {children}
    </Tag>
  )
}
