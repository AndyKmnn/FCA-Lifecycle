import { useMemo } from 'react'
import type { Profile } from '../../data'
import { Button, Chip, Separator, Surface } from '../../design'
import { LIMIT_TYPE_LABEL, monthsSkipped, type Operator } from './operators'

/**
 * One operator's terms in full, and the panel that overrides them.
 *
 * Every field an operator negotiates is editable here, and the four figures
 * underneath recompute against the site's own profile as it is typed. That is
 * the point of the screen: a cap is not a number on a page, it is hours and
 * megawatt-hours and euros, and the only way to feel that is to change it and
 * watch them move.
 *
 * Amendments are the presenter's, not the operator's. They are kept in memory,
 * marked in the list, and thrown away on reset.
 */

export interface OperatorDetailProps {
  operator: Operator | null
  /** The operator's own terms, before any amendment. */
  original: Operator | null
  profile: Profile
  amended: boolean
  onAmend: (patch: Partial<Operator>) => void
  onReset: () => void
}

/** Hours above a flat cap, and what that costs, straight off the profile. */
function costOf(profile: Profile, capMw: number) {
  let hours = 0
  let energyMwh = 0
  for (const v of profile.values) {
    if (v > capMw) {
      hours += 0.25
      energyMwh += (v - capMw) * 0.25
    }
  }
  return {
    hours,
    energyMwh,
    sharePct: (energyMwh / profile.meta.annualMwh) * 100,
    costEur: energyMwh * profile.meta.marginEurPerMwh,
  }
}

function Field({
  label,
  value,
  unit,
  step = 0.1,
  min = 0,
  max,
  changed,
  onChange,
}: {
  label: string
  value: number
  unit: string
  step?: number
  min?: number
  max?: number
  changed: boolean
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="micro text-muted-foreground">
        {label}
        {changed ? <span className="ml-1.5 text-warn">changed</span> : null}
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`tabular h-9 w-full rounded-md border bg-background px-2.5 text-[15px] font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
            changed ? 'border-warn' : 'border-border'
          }`}
        />
        <span className="font-mono text-[12px] text-muted-foreground">{unit}</span>
      </span>
    </label>
  )
}

function Derived({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <span className="micro text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="tabular text-[22px] leading-none font-semibold tracking-[-0.02em] text-foreground">
          {value}
        </span>
        <span className="font-mono text-[12px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

export function OperatorDetail({
  operator,
  original,
  profile,
  amended,
  onAmend,
  onReset,
}: OperatorDetailProps) {
  const cap = operator?.capMw ?? 0
  const result = useMemo(
    () => (operator && operator.offersFca ? costOf(profile, cap) : null),
    [profile, cap, operator],
  )

  if (!operator || !original) {
    return (
      <Surface className="flex min-h-0 w-[420px] shrink-0 items-center justify-center p-8">
        <p className="text-center text-[14px] text-muted-foreground">
          Pick a Kreis on the map, or a row in the database, to see the terms that operator
          would write.
        </p>
      </Surface>
    )
  }

  const changed = <K extends keyof Operator>(k: K) => operator[k] !== original[k]

  return (
    <Surface className="flex min-h-0 w-[420px] shrink-0 flex-col">
      <div className="shrink-0 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[19px] font-semibold tracking-[-0.02em] text-foreground">
              {operator.kreis}
            </h3>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{operator.name}</p>
          </div>
          <Chip tone={operator.offersFca ? 'accent' : 'default'} className="shrink-0">
            {LIMIT_TYPE_LABEL[operator.limitType]}
          </Chip>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span>{operator.state}</span>
          <span>{operator.voltageLevel}</span>
          <span className="tabular">{operator.headroomMw.toFixed(1)} MW headroom</span>
          <span className="tabular">digitalisation {operator.digitalisation}</span>
        </div>
      </div>

      <Separator className="shrink-0" />

      {!operator.offersFca ? (
        <div className="p-5">
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            This operator writes no flexible connection agreement. A connection here waits for
            reinforcement - {operator.monthsToConnect} months on the current plan.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Operators are not obliged to offer one. The Netzanschlusspaket would make it
            mandatory on request; it is still a draft.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Field
              label="Cap"
              value={operator.capMw}
              unit="MW"
              max={10}
              changed={changed('capMw')}
              onChange={(v) => onAmend({ capMw: v })}
            />
            <Field
              label="Guaranteed firm"
              value={operator.guaranteedMinimumMw}
              unit="MW"
              max={10}
              changed={changed('guaranteedMinimumMw')}
              onChange={(v) => onAmend({ guaranteedMinimumMw: v })}
            />
            <Field
              label="Connected in"
              value={operator.monthsToConnect}
              unit="months"
              step={1}
              max={120}
              changed={changed('monthsToConnect')}
              onChange={(v) => onAmend({ monthsToConnect: v })}
            />
            <Field
              label="Firm capacity in"
              value={operator.monthsToFirm}
              unit="months"
              step={1}
              max={120}
              changed={changed('monthsToFirm')}
              onChange={(v) => onAmend({ monthsToFirm: v })}
            />
            <Field
              label="Curtailment ceiling"
              value={operator.maxCurtailmentHours}
              unit="h/yr"
              step={10}
              max={4000}
              changed={changed('maxCurtailmentHours')}
              onChange={(v) => onAmend({ maxCurtailmentHours: v })}
            />
            <Field
              label="Connection charge"
              value={operator.bkzEurPerKw}
              unit="EUR/kW"
              step={5}
              max={500}
              changed={changed('bkzEurPerKw')}
              onChange={(v) => onAmend({ bkzEurPerKw: v })}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
            <span className="text-[13px] text-foreground">Compensated above the firm level</span>
            <button
              type="button"
              role="switch"
              aria-checked={operator.compensationAboveCap}
              onClick={() => onAmend({ compensationAboveCap: !operator.compensationAboveCap })}
              className={`h-6 w-11 shrink-0 rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                operator.compensationAboveCap
                  ? 'border-primary bg-primary/30'
                  : 'border-border bg-muted'
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-foreground transition-transform ${
                  operator.compensationAboveCap ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="mt-3 text-[12px] text-muted-foreground">
            Notice period: {operator.noticePeriod}. Connection charge applies to the full
            {' '}{profile.meta.connectionMw} MW requested.
          </p>

          <Separator className="my-5" />

          <span className="micro text-muted-foreground">What that cap costs this site</span>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
            <Derived
              label="Hours affected"
              value={result ? Math.round(result.hours).toLocaleString('en-GB') : '-'}
              unit="h/yr"
            />
            <Derived
              label="Energy at risk"
              value={result ? Math.round(result.energyMwh).toLocaleString('en-GB') : '-'}
              unit="MWh"
            />
            <Derived
              label="Cost of the cap"
              value={result ? Math.round(result.costEur / 1000).toLocaleString('en-GB') : '-'}
              unit="k EUR/yr"
            />
            <Derived
              label="Queue skipped"
              value={monthsSkipped(operator).toLocaleString('en-GB')}
              unit="months"
            />
          </div>

          {result && result.hours === 0 ? (
            <p className="mt-4 text-[13px] leading-relaxed font-medium text-ok">
              The cap never binds: it sits at or above this site&rsquo;s{' '}
              {profile.meta.peakMw.toFixed(2)} MW peak, so the connection is flexible on paper
              and firm in practice. Pull the cap down to find the level where that stops being
              true.
            </p>
          ) : null}

          {result && result.hours > operator.maxCurtailmentHours ? (
            <p className="mt-4 text-[13px] leading-relaxed font-medium text-warn">
              This cap would curtail {Math.round(result.hours).toLocaleString('en-GB')} hours, above
              the {operator.maxCurtailmentHours.toLocaleString('en-GB')} hour ceiling in the terms.
              Either the ceiling rises or the cap does.
            </p>
          ) : null}
        </div>
      )}

      {amended ? (
        <div className="shrink-0 border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={onReset} className="w-full">
            Reset to the operator&rsquo;s terms
          </Button>
        </div>
      ) : null}
    </Surface>
  )
}
