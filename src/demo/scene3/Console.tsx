import { memo, useMemo } from 'react'
import { Label, Surface } from '../../design'
import { hhmm, mw, mwh } from './format'
import type { DayPlan } from './replan'

/**
 * The Demo DSO console: the day-ahead limit feed, written as an API log.
 *
 * The feed is derived from the current day rather than accumulated in state, so
 * jumping to a scripted day rebuilds exactly the same history every time. A day
 * carrying a limit gets an amber rule down its left edge - the same signal the
 * cap line uses on the chart.
 */

const VISIBLE_DAYS = 11

export interface ConsoleProps {
  days: DayPlan[]
  day: number
  operator: string
  defaultLimitMw: number
}

function ConsoleInner({ days, day, operator, defaultLimitMw }: ConsoleProps) {
  const feed = useMemo(
    () => days.slice(Math.max(0, day - VISIBLE_DAYS + 1), day + 1),
    [days, day],
  )

  return (
    <Surface className="flex w-[430px] shrink-0 flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">
            {operator} console
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Day-ahead limit feed</p>
        </div>
        <Label kind="simulation" className="shrink-0" />
      </div>

      <Surface
        variant="inset"
        radius="md"
        className="mt-4 flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-3 py-3"
      >
        <div className="flex flex-col gap-1.5 font-mono text-[12px] leading-[1.45]">
          {feed.map((d) =>
            d.constrained ? (
              <ConstrainedEntry key={d.date} day={d} />
            ) : (
              <QuietEntry key={d.date} day={d} defaultLimitMw={defaultLimitMw} />
            ),
          )}
        </div>
      </Surface>
    </Surface>
  )
}

function QuietEntry({ day, defaultLimitMw }: { day: DayPlan; defaultLimitMw: number }) {
  return (
    <div className="flex items-center gap-2 px-2 text-muted-foreground">
      <span className="text-ok">200</span>
      <span className="tabular">{day.date}</span>
      <span>no limit</span>
      <span className="tabular ml-auto">{defaultLimitMw.toFixed(1)} MW</span>
    </div>
  )
}

function ConstrainedEntry({ day }: { day: DayPlan }) {
  const win = day.windows[0]
  const ok = day.breachSteps === 0
  return (
    <div className="rounded-r-md border-l-2 border-primary bg-card py-2 pr-2 pl-2.5">
      <div className="flex items-center gap-2 text-foreground">
        <span className="font-semibold">POST</span>
        <span>/fca/v1/limits</span>
        <span className="tabular ml-auto text-muted-foreground">{day.date}</span>
      </div>
      <div className="mt-1 text-muted-foreground">
        {'{ '}
        <span className="text-foreground">&quot;notice&quot;</span>: &quot;day-ahead&quot;,{' '}
        <span className="text-foreground">&quot;window&quot;</span>: &quot;
        {win ? `${hhmm(win.startHour)}-${hhmm(win.endHour)}` : '-'}&quot;,{' '}
        <span className="text-foreground">&quot;limit_mw&quot;</span>:{' '}
        <span className="tabular font-semibold text-foreground">
          {win ? win.limitMw.toFixed(1) : '-'}
        </span>
        {' }'}
      </div>
      <div className="mt-0.5 truncate text-muted-foreground">{day.reason}</div>
      <div className={`mt-1 font-medium ${ok ? 'text-ok' : 'text-warn'}`}>
        {ok ? '✓ re-plan' : '✗ breach'}
        {' · battery '}
        <span className="tabular">{mwh(day.dischargedMwh)}</span> MWh
        {day.slowedMwh > 0.001 ? (
          <>
            {' · sessions -'}
            <span className="tabular">{mwh(day.slowedMwh * 1000)}</span> kWh
          </>
        ) : null}
        {' · peak '}
        <span className="tabular">{mw(day.peakGridMw)}</span> MW
      </div>
    </div>
  )
}

export const Console = memo(ConsoleInner)
