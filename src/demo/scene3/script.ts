/**
 * The scripted facts for scene 3. Every figure here is quoted from
 * docs/DEMO_SCRIPT.md - nothing is invented. Everything else on screen is
 * computed from public/data by replan.ts.
 */

/** "Firm 6 MW only after grid reinforcement, 48 months away." */
export const WAIT_MONTHS = 48
/** "With an FCA the site connects in 8 months". */
export const FCA_MONTHS = 8
/** "40 months of queue skipped." */
export const MONTHS_SKIPPED = WAIT_MONTHS - FCA_MONTHS

/**
 * The three jump-to days. Only the date and the button label live here - the cap,
 * the hours and the reason are read from public/data/limits.json at runtime, so
 * they cannot drift from the data the way a second copy would.
 */
export const JUMP_DAYS: ReadonlyArray<{ date: string; short: string }> = [
  { date: '2026-01-20', short: 'Cold January evening' },
  { date: '2026-04-03', short: 'Easter travel peak' },
  { date: '2026-06-19', short: 'Sunny June Friday' },
]

/** "End card: 'Connected 40 months earlier. Every limit met.'" */
export const END_CARD_HEADLINE = `Connected ${MONTHS_SKIPPED} months earlier.`
export const END_CARD_SUBHEAD = 'Every limit met.'

/** One year of replay in about 90 seconds. */
export const REPLAY_SECONDS = 90
/** A constrained day is held this long so the re-plan is visible. */
export const CONSTRAINED_DAY_SECONDS = 1.5

export const SPEEDS = [1, 2, 4] as const
export type Speed = (typeof SPEEDS)[number]
