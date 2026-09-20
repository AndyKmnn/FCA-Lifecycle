import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Counter, Stat, Surface } from '../../design'
import { END_CARD_HEADLINE, END_CARD_SUBHEAD, MONTHS_SKIPPED } from './script'
import type { YearPlan } from './replan'

export interface EndCardProps {
  plan: YearPlan
  onClose: () => void
}

/**
 * The closing card, worded as in docs/DEMO_SCRIPT.md.
 *
 * It used to appear by itself when the replay reached 31 December. The presenter
 * now calls it up from the top bar, so it closes rather than replays - and its
 * figures follow any cap that has been dragged, which is why the headline still
 * checks whether the year came out clean.
 */
export function EndCard({ plan, onClose }: EndCardProps) {
  const clean = plan.totals.breachSteps === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[2px]"
    >
      <Surface className="relative flex w-[1000px] flex-col items-center overflow-hidden px-16 py-14">
        <div aria-hidden className="rule-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-col items-center">
          <h2 className="text-center text-[52px] leading-[1.1] font-semibold tracking-[-0.03em] text-foreground">
            {END_CARD_HEADLINE}
            <br />
            {clean ? (
              END_CARD_SUBHEAD
            ) : (
              <span className="text-warn">
                {plan.totals.breachSteps} quarter-hours above the cap.
              </span>
            )}
          </h2>

          <div className="mt-11 flex items-stretch gap-4">
            <Stat
              label="Queue skipped"
              unit="months"
              value={<Counter value={MONTHS_SKIPPED} />}
            />
            <Stat
              label="Earned versus waiting"
              unit="m euros"
              value={<Counter value={plan.totals.revenueEur / 1e6} decimals={2} />}
            />
            <Stat
              label="Breaches"
              unit="quarter-hours"
              value={
                <span className={clean ? 'text-ok' : 'text-warn'}>
                  <Counter value={plan.totals.breachSteps} />
                </span>
              }
            />
          </div>

          <div className="mt-11 flex items-center gap-3">
            <Button size="2xl" onClick={onClose}>
              Back to the day
            </Button>
            <Link to="/">
              <Button size="2xl" variant="outline">
                Back to site
              </Button>
            </Link>
          </div>
        </div>
      </Surface>
    </motion.div>
  )
}
