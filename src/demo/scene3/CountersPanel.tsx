import type { ReactNode } from 'react'
import { Counter, Label, Stat, Surface } from '../../design'
import { eurMillions } from './format'
import { FCA_MONTHS, MONTHS_SKIPPED, WAIT_MONTHS } from './script'
import type { YearPlan } from './replan'

/**
 * The three running counters, mounted on one plate.
 *
 * While the year plays they are plain tabular figures refreshed on the replay's
 * slow tick; once the year lands they are handed to the design-system Counter,
 * which animates up to the final number. Counter restarts from zero on every
 * value change, so it is only ever given a value that has stopped moving.
 */

export interface CountersPanelProps {
  plan: YearPlan
  day: number
  dayProgress: number
  yearProgress: number
  settled: boolean
}

function interpolate(series: number[], day: number, within: number): number {
  const previous = day > 0 ? series[day - 1] : 0
  return previous + (series[day] - previous) * within
}

export function CountersPanel({
  plan,
  day,
  dayProgress,
  yearProgress,
  settled,
}: CountersPanelProps) {
  const months = MONTHS_SKIPPED * yearProgress
  const revenue = interpolate(plan.revenueByDay, day, dayProgress)
  const breaches = plan.breachesByDay[day]

  return (
    <Surface variant="pressed" className="flex w-[360px] shrink-0 flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">
          Year to date
        </h3>
        <Label kind="simulation" className="shrink-0" />
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        <Stat
          className="flex-1 justify-center"
          label="Queue skipped"
          unit="months"
          hint={`Connected in ${FCA_MONTHS} months, not ${WAIT_MONTHS}`}
          value={
            settled ? <Counter value={MONTHS_SKIPPED} /> : Math.round(months).toLocaleString('en-GB')
          }
        />
        <Stat
          className="flex-1 justify-center"
          label="Earned versus waiting"
          unit="m euros"
          hint={`Energy served, at ${plan.marginEurPerMwh} euros per MWh`}
          value={
            settled ? (
              <Counter value={plan.totals.revenueEur / 1e6} decimals={2} />
            ) : (
              eurMillions(revenue)
            )
          }
        />
        <Stat
          className="flex-1 justify-center"
          label="Breaches"
          unit={breaches === 1 ? 'quarter-hour' : 'quarter-hours'}
          hint="Quarter-hours above the day-ahead cap"
          value={
            <Tone clean={breaches === 0}>
              {settled ? <Counter value={plan.totals.breachSteps} /> : breaches}
            </Tone>
          }
        />
      </div>
    </Surface>
  )
}

/** Zero breaches is the result the scene is about, so it is stated in the ok colour. */
function Tone({ clean, children }: { clean: boolean; children: ReactNode }) {
  return <span className={clean ? 'text-ok' : 'text-warn'}>{children}</span>
}
