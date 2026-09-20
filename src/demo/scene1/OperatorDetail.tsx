import { useMemo, useState } from 'react'
import type { Limits, Profile } from '../../data'
import { Button, Chip, Separator, Surface } from '../../design'
import { BenchmarkPanel } from './BenchmarkPanel'
import { curtailmentOf } from './curtailment'
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
  /** Everything comparable, for the benchmark. */
  corpus: Operator[]
  profile: Profile
  limits: Limits
  /** The year the terms are read as of. */
  year: number
  amended: boolean
  onAmend: (patch: Partial<Operator>) => void
  onReset: () => void
}

/**
 * A number the presenter can retype.
 *
 * Deliberately `type="text"` with a decimal input mode rather than
 * `type="number"`. A number input hands back the empty string for anything
 * that is not a complete valid number, and `Number('')` is 0 - so clearing the
 * cap field set it to nought, and the four figures below reported the site's
 * entire annual consumption as energy at risk. Worse, typing "4.5" passes
 * through "4.", which is also not a complete number, so the field reset itself
 * to 0 mid-keystroke and the caret jumped. Values that far from reality do not
 * stay on this screen: they travel into the API payload and into the signed
 * agreement two scenes later.
 *
 * So the draft is held as text while it is being typed, and only committed when
 * it parses to a finite number inside its own bounds. Blur clears the draft,
 * which snaps the field back to whatever was last committed.
 */
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
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    setDraft(raw)
    if (raw.trim() === '') return
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    if (n < min) return
    if (max !== undefined && n > max) return
    onChange(n)
  }

  return (
    <label className="block">
      <span className="micro text-muted-foreground">
        {label}
        {changed ? <span className="ml-1.5 text-warn">changed</span> : null}
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={draft ?? String(value)}
          step={step}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(null)}
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
  corpus,
  profile,
  limits,
  year,
  amended,
  onAmend,
  onReset,
}: OperatorDetailProps) {
  const result = useMemo(
    () => (operator && operator.offersFca ? curtailmentOf(operator, profile, limits, year) : null),
    [operator, profile, limits, year],
  )

  if (!operator || !original) {
    return (
      <Surface className="flex min-h-0 w-[420px] flex-1 items-center justify-center p-8">
        <p className="text-center text-[14px] text-muted-foreground">
          Pick a Kreis on the map, or a row in the database, to see the terms that operator
          would write.
        </p>
      </Surface>
    )
  }

  const changed = <K extends keyof Operator>(k: K) => operator[k] !== original[k]

  return (
    <Surface className="flex min-h-0 w-[420px] flex-1 flex-col">
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
              max={profile.meta.connectionMw}
              changed={changed('capMw')}
              onChange={(v) =>
                // Dropping the ceiling below the firm level would promise more
                // than the connection allows, so the firm level follows it down.
                onAmend({
                  capMw: v,
                  ...(operator.guaranteedMinimumMw > v ? { guaranteedMinimumMw: v } : {}),
                })
              }
            />
            <Field
              label="Guaranteed firm"
              value={operator.guaranteedMinimumMw}
              unit="MW"
              max={operator.capMw}
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

          <BenchmarkPanel operator={operator} corpus={corpus} />

          {result && result.hours === 0 ? (
            <p className="mt-4 text-[13px] leading-relaxed font-medium text-ok">
              This regime never binds against the site&rsquo;s{' '}
              {profile.meta.peakMw.toFixed(2)} MW peak: flexible on paper, firm in practice.
              Pull the cap down to find the level where that stops being true.
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
