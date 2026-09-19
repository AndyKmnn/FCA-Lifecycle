import type { Transition, Variants } from 'framer-motion'

/**
 * One easing set for the whole site. Every reveal on the landing page uses these
 * constants, so the page has a single rhythm.
 * Only opacity and transform are animated - that keeps the reveals on the compositor.
 */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const DURATION = { fast: 0.35, base: 0.55, slow: 0.8 } as const

export const TRANSITION: Transition = { duration: DURATION.base, ease: EASE }

/** Viewport settings shared by every scroll-triggered reveal. */
export const VIEWPORT = { once: true, amount: 0.25 } as const

/** Fade up. The default reveal. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 28 },
  shown: { opacity: 1, y: 0, transition: TRANSITION },
}

/** Parent that reveals its children one after the other. */
export function stagger(step = 0.09, delay = 0): Variants {
  return {
    hidden: {},
    shown: { transition: { staggerChildren: step, delayChildren: delay } },
  }
}
