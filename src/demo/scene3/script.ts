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

/** The three jump-to days, with the wording the script uses for each. */
export const JUMP_DAYS: ReadonlyArray<{ date: string; short: string; blurb: string }> = [
  {
    date: '2026-01-20',
    short: 'Cold January evening',
    blurb: 'Cold January weekday evening - cap 2.5 MW, 17-20 h',
  },
  {
    date: '2026-04-03',
    short: 'Easter travel peak',
    blurb: 'Good Friday - cap 4 MW, 11-15 h, the hardest day',
  },
  {
    date: '2026-06-19',
    short: 'Sunny June Friday',
    blurb: 'Sunny June Friday - no cap, the battery charges cheaply',
  },
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
