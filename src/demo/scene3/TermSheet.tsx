import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Profile } from '../../data'
import { Button } from '../../design'
import type { Chosen } from '../scene1/selection'
import type { LimitType } from '../scene1/operators'
import { HOURS_PER_STEP, type YearPlan } from './replan'
import { Submission } from './Submission'

/**
 * The draft agreement, as a document rather than a screen.
 *
 * It renders through a portal onto document.body rather than inside the scene.
 * The presenter view scales a 1920x1080 stage with a CSS transform, and a
 * printer given that transform prints it - a page two thirds full of a shrunken
 * document. Outside the stage there is no transform to inherit.
 *
 * Printing is the browser's own: Cmd+P, save as PDF. No renderer, no build
 * step, nothing to install - and pressing Cmd+P in the room and having an A4
 * document appear is a better beat than a download nobody opens.
 *
 * German and English, switchable. The counterparty is a German grid operator
 * and the instrument is German law, so German is the default - but half the
 * people who will be shown this document do not read it, and a term sheet
 * nobody in the room can follow is a term sheet nobody discusses.
 */

type Lang = 'de' | 'en'

const LOCALE: Record<Lang, string> = { de: 'de-DE', en: 'en-GB' }

const LIMIT_TYPE: Record<Lang, Record<LimitType, string>> = {
  de: {
    fullyDynamic: 'Vollständig dynamisch',
    dynamic: 'Saisonale Tageszeitbegrenzung',
    static: 'Statische Begrenzung',
    none: 'Keine Vereinbarung',
  },
  en: {
    fullyDynamic: 'Fully dynamic',
    dynamic: 'Seasonal time-of-day limit',
    static: 'Static limit',
    none: 'No agreement',
  },
}

/**
 * How often the agreed cap would actually bind, across the analysed year.
 *
 * Not the same thing as the breach counter in the scene: that counts the
 * quarter-hours the autopilot failed to hold, which is zero when it works. This
 * counts the quarter-hours the site would have wanted more than the cap allows,
 * which is what the annex to the contract has to state.
 */
function bindingSummary(plan: YearPlan) {
  let steps = 0
  let energyMwh = 0
  let run = 0
  let longestRun = 0
  for (const day of plan.days) {
    for (let s = 0; s < day.requested.length; s++) {
      const over = day.requested[s] - day.cap[s]
      if (over > 1e-9) {
        steps++
        energyMwh += over * HOURS_PER_STEP
        run++
        if (run > longestRun) longestRun = run
      } else run = 0
    }
  }
  return {
    hours: steps * HOURS_PER_STEP,
    energyMwh,
    longestRunHours: longestRun * HOURS_PER_STEP,
  }
}

export interface TermSheetProps {
  chosen: Chosen
  profile: Profile
  plan: YearPlan
  year: number
  onClose: () => void
}

function Row({ n, head, children }: { n: number; head: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-[#c9cfd4] align-top">
      <th className="w-[32%] py-3 pr-4 text-left text-[13px] font-semibold">
        <span className="mr-2 font-normal text-[#5b6b77]">{n}</span>
        {head}
      </th>
      <td className="py-3 text-[13px] leading-relaxed">{children}</td>
    </tr>
  )
}

export function TermSheet({ chosen, profile, plan, year, onClose }: TermSheetProps) {
  const [lang, setLang] = useState<Lang>('de')
  /** Set once the operator approves, which stamps the document. */
  const [approvedRef, setApprovedRef] = useState<string | null>(null)
  const binding = useMemo(() => bindingSummary(plan), [plan])

  const o = chosen.operator
  const locale = LOCALE[lang]
  const n = (v: number, digits = 0) =>
    v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const date = (d: Date) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d)

  const energised = new Date(Date.UTC(year, o.monthsToConnect, 1))
  const firm = new Date(Date.UTC(year, o.monthsToFirm, 1))
  const type = LIMIT_TYPE[lang][o.limitType]
  const de = lang === 'de'

  const clauses: Array<{ head: string; body: React.ReactNode }> = de
    ? [
        {
          head: 'Flexible Anschlusskapazität',
          body: `${n(profile.meta.connectionMw, 1)} MW Bezugsleistung, die im Rahmen dieser Vereinbarung bereitgestellt wird.`,
        },
        {
          head: 'Garantierte feste Leistung',
          body: `${n(o.guaranteedMinimumMw, 1)} MW. Bezug bis zu dieser Höhe wird zu keinem Zeitpunkt reduziert.`,
        },
        {
          head: 'Limitierungsart und Ankündigung',
          body: `${type}, Obergrenze ${n(o.capMw, 1)} MW. Ankündigungsfrist: ${o.noticePeriod}.`,
        },
        {
          head: 'Obergrenze der Reduzierung',
          body: `Höchstens ${n(o.maxCurtailmentHours)} Stunden je Kalenderjahr.${
            o.compensationAboveCap
              ? ' Darüber hinausgehende Reduzierungen werden entschädigt.'
              : ' Eine Entschädigung ist nicht vereinbart.'
          }`,
        },
        {
          head: 'Erwartete Reduzierung (Anlage)',
          body: `Rund ${n(binding.hours)} Stunden im Jahr oberhalb der Obergrenze, ${n(binding.energyMwh)} MWh bzw. ${n((binding.energyMwh / profile.meta.annualMwh) * 100, 2)} % der Jahresarbeit; längste zusammenhängende Reduzierung ${n(binding.longestRunHours, 2)} Stunden. Informatorisch, auf Basis des analysierten Lastjahres.`,
        },
        {
          head: 'Baukostenzuschuss',
          body: `${n(o.bkzEurPerKw)} EUR je kW, insgesamt ${n(o.bkzEurPerKw * profile.meta.connectionMw * 1000)} EUR.`,
        },
        {
          head: 'Inbetriebnahme',
          body: `Voraussichtlich ${date(energised)} (${n(o.monthsToConnect)} Monate), statt ${n(o.monthsToFirm)} Monaten bis zur festen Anschlusskapazität.`,
        },
        {
          head: 'Umstellung auf festen Anschluss',
          body: `Mit Abschluss des Netzausbaus, indikativ ${date(firm)}.`,
        },
      ]
    : [
        {
          head: 'Flexible connection capacity',
          body: `${n(profile.meta.connectionMw, 1)} MW of withdrawal capacity made available under this agreement.`,
        },
        {
          head: 'Guaranteed firm capacity',
          body: `${n(o.guaranteedMinimumMw, 1)} MW. Draw up to this level is never curtailed.`,
        },
        {
          head: 'Limitation type and notice',
          body: `${type}, ceiling ${n(o.capMw, 1)} MW. Notice period: ${o.noticePeriod}.`,
        },
        {
          head: 'Ceiling on curtailment',
          body: `At most ${n(o.maxCurtailmentHours)} hours per calendar year.${
            o.compensationAboveCap
              ? ' Curtailment beyond that is compensated.'
              : ' No compensation is agreed.'
          }`,
        },
        {
          head: 'Expected curtailment (annex)',
          body: `Approximately ${n(binding.hours)} hours a year above the ceiling, ${n(binding.energyMwh)} MWh or ${n((binding.energyMwh / profile.meta.annualMwh) * 100, 2)} % of annual energy; longest continuous curtailment ${n(binding.longestRunHours, 2)} hours. Informational, based on the analysed load year.`,
        },
        {
          head: 'Connection charge',
          body: `${n(o.bkzEurPerKw)} EUR per kW, ${n(o.bkzEurPerKw * profile.meta.connectionMw * 1000)} EUR in total.`,
        },
        {
          head: 'Energisation',
          body: `Expected ${date(energised)} (${n(o.monthsToConnect)} months), against ${n(o.monthsToFirm)} months to firm connection capacity.`,
        },
        {
          head: 'Conversion to a firm connection',
          body: `On completion of grid reinforcement, indicatively ${date(firm)}.`,
        },
      ]

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f3f5f4] print:static print:overflow-visible print:bg-white">
      <div className="no-print sticky top-0 flex items-center justify-between gap-4 border-b border-[#d9dfe2] bg-white px-8 py-4">
        <span className="text-[14px] font-medium text-[#1f2a33]">{o.name}</span>
        <span className="flex items-center gap-3">
          <span className="flex overflow-hidden rounded-md border border-[#d9dfe2]">
            {(['de', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={l === lang}
                className={`px-3 py-1.5 text-[12px] font-medium ${
                  l === lang ? 'bg-[#1f2a33] text-white' : 'bg-white text-[#5b6b77]'
                }`}
              >
                {l === 'de' ? 'Deutsch' : 'English'}
              </button>
            ))}
          </span>
          <Button size="sm" onClick={() => window.print()}>
            {de ? 'Drucken / als PDF' : 'Print / save as PDF'}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            {de ? 'Schließen' : 'Close'}
          </Button>
        </span>
      </div>

      <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-8 py-10 print:block print:max-w-none print:p-0">
      <article
        className="print-document min-w-0 flex-1 bg-white px-14 py-12 text-[#1f2a33] print:max-w-none print:px-0 print:py-0"
        lang={lang}
      >
        <header className="flex items-start justify-between gap-6 border-b border-[#1f2a33] pb-5">
          <div>
            <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">
              {de ? 'Flexible Netzanschlussvereinbarung' : 'Flexible connection agreement'}
            </h1>
            <p className="mt-1.5 text-[13px] text-[#5b6b77]">
              {approvedRef
                ? de
                  ? 'Vom Netzbetreiber freigegeben'
                  : 'Approved by the network operator'
                : de
                  ? 'Entwurf, unverbindliche Verhandlungsgrundlage nach § 17 Abs. 2b EnWG'
                  : 'Draft, non-binding basis for negotiation under section 17(2b) EnWG'}
            </p>
          </div>
          {approvedRef ? (
            <div className="shrink-0 rounded border border-[#12705a] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold tracking-wide text-[#12705a] uppercase">
                {de ? 'Freigegeben' : 'Approved'}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-[#1f2a33]">{approvedRef}</p>
            </div>
          ) : null}
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-x-10 gap-y-3 text-[13px]">
          <div>
            <dt className="text-[#5b6b77]">{de ? 'Anschlussnehmer' : 'Connection customer'}</dt>
            <dd className="mt-0.5 font-medium">{profile.meta.site}</dd>
          </div>
          <div>
            <dt className="text-[#5b6b77]">{de ? 'Netzbetreiber' : 'Network operator'}</dt>
            <dd className="mt-0.5 font-medium">{o.name}</dd>
          </div>
          <div>
            <dt className="text-[#5b6b77]">{de ? 'Netzebene' : 'Voltage level'}</dt>
            <dd className="mt-0.5 font-medium">{o.voltageLevel}</dd>
          </div>
          <div>
            <dt className="text-[#5b6b77]">{de ? 'Stand' : 'As at'}</dt>
            <dd className="mt-0.5 font-medium">{date(new Date(Date.UTC(year, 0, 1)))}</dd>
          </div>
        </dl>

        <table className="mt-7 w-full border-collapse">
          <tbody>
            {clauses.map((c, i) => (
              <Row key={c.head} n={i + 1} head={c.head}>
                {c.body}
              </Row>
            ))}
          </tbody>
        </table>

        <p className="mt-7 border-t border-[#d9dfe2] pt-4 text-[11.5px] leading-relaxed text-[#5b6b77]">
          {de ? (
            <>
              Grundlage: analysiertes Lastprofil des Anschlussnehmers, {n(profile.meta.count)}{' '}
              Viertelstundenwerte.
              {chosen.amended
                ? ' Einzelne Konditionen wurden gegenüber dem Angebot des Netzbetreibers angepasst.'
                : ''}{' '}
              Die Zahlen bilden ausschließlich das analysierte Lastjahr ab &mdash;{' '}
              <strong className="font-semibold">
                künftige Netzengpässe und das Abrufverhalten des Netzbetreibers sind nicht
                modelliert
              </strong>{' '}
              und müssen vertraglich abgesichert werden, nicht analytisch.
            </>
          ) : (
            <>
              Basis: the customer&rsquo;s analysed load profile, {n(profile.meta.count)}{' '}
              quarter-hourly values.
              {chosen.amended
                ? ' Individual terms have been amended against the operator&rsquo;s offer.'
                : ''}{' '}
              The figures reflect the analysed load year only &mdash;{' '}
              <strong className="font-semibold">
                future grid congestion and the operator&rsquo;s dispatch behaviour are not
                modelled
              </strong>{' '}
              and must be covered contractually, not analytically.
            </>
          )}
        </p>
      </article>

      <Submission
        operator={o}
        profile={profile}
        year={year}
        de={de}
        onApproved={setApprovedRef}
      />
      </div>
    </div>,
    document.body,
  )
}
