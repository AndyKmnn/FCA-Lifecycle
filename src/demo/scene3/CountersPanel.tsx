import type { ReactNode } from 'react'
import { Stat, Surface } from '../../design'
import { eurMillions, mwh } from './format'
import { FCA_MONTHS, MONTHS_SKIPPED, WAIT_MONTHS } from './script'
import type { DayPlan, YearPlan } from './replan'

/**
 * The three figures the scene is about, on one plate.
 *
 * Breaches are shown for the day on screen, because that is the number that
 * answers the question the presenter is asking while dragging the cap: push the
 * limit down far enough and this day stops being holdable. The year total sits
 * underneath it as the hint.
 *
 * Nothing here animates. The design-system Counter restarts from zero on every
 * value change, which was right when the year played itself and landed once -
 * and wrong now that a figure can change on every pointer move.
 */

export interface CountersPanelProps {
  plan: YearPlan
  today: DayPlan
}

export function CountersPanel({ plan, today }: CountersPanelProps) {
  const breaches = today.breachSteps
  const yearBreaches = plan.totals.breachSteps

  return (
    <Surface variant="pressed" className="flex w-[360px] shrink-0 flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">
          The year
        </h3>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        <Stat
          className="flex-1 justify-center"
          label="Queue skipped"
          unit="months"
          hint={`Connected in ${FCA_MONTHS} months, not ${WAIT_MONTHS}`}
          value={MONTHS_SKIPPED.toLocaleString('en-GB')}
        />
        <Stat
          className="flex-1 justify-center"
          label="Earned versus waiting"
          unit="m euros"
          hint={`Energy served, at ${plan.marginEurPerMwh} euros per MWh`}
          value={eurMillions(plan.totals.revenueEur)}
        />
        <Stat
          className="flex-1 justify-center"
          label="Breaches on this day"
          unit={breaches === 1 ? 'quarter-hour' : 'quarter-hours'}
          hint={
            yearBreaches === 0
              ? 'None anywhere in the year'
              : `${yearBreaches.toLocaleString('en-GB')} across the year, on ${plan.totals.breachDays} ${
                  plan.totals.breachDays === 1 ? 'day' : 'days'
                }`
          }
          value={<Tone clean={breaches === 0}>{breaches}</Tone>}
        />
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
        Slowed today {mwh(today.slowedMwh)} MWh &middot; battery gave back{' '}
        {mwh(today.dischargedMwh)} MWh &middot; peak at the meter{' '}
        {today.peakGridMw.toFixed(2)} MW
      </p>
    </Surface>
  )
}

/** Zero breaches is the result the scene is about, so it is stated in the ok colour. */
function Tone({ clean, children }: { clean: boolean; children: ReactNode }) {
  return <span className={clean ? 'text-ok' : 'text-warn'}>{children}</span>
}
