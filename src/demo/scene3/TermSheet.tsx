import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Profile } from '../../data'
import { Button } from '../../design'
import type { Chosen } from '../scene1/selection'
import { LIMIT_TYPE_LABEL } from '../scene1/operators'
import { HOURS_PER_STEP, type YearPlan } from './replan'

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
 */

const DE_DATE = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const de = (n: number, digits = 0) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })

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
  const binding = useMemo(() => bindingSummary(plan), [plan])
  const o = chosen.operator
  const energised = new Date(Date.UTC(year, o.monthsToConnect, 1))
  const firm = new Date(Date.UTC(year, o.monthsToFirm, 1))

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f3f5f4] print:static print:overflow-visible print:bg-white">
      <div className="no-print sticky top-0 flex items-center justify-between gap-4 border-b border-[#d9dfe2] bg-white px-8 py-4">
        <span className="text-[14px] font-medium text-[#1f2a33]">
          Draft agreement &mdash; {o.name}
        </span>
        <span className="flex items-center gap-3">
          <Button size="sm" onClick={() => window.print()}>
            Print / save as PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </span>
      </div>

      <article
        className="print-document mx-auto my-10 max-w-[820px] bg-white px-14 py-12 text-[#1f2a33] print:my-0 print:max-w-none print:px-0 print:py-0"
        lang="de"
      >
        <header className="border-b border-[#1f2a33] pb-5">
          <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">
            Flexible Netzanschlussvereinbarung
          </h1>
          <p className="mt-1.5 text-[13px] text-[#5b6b77]">
            Entwurf, unverbindliche Verhandlungsgrundlage nach &sect; 17 Abs. 2b EnWG
          </p>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-x-10 gap-y-3 text-[13px]">
          <div>
            <dt className="text-[#5b6b77]">Anschlussnehmer</dt>
            <dd className="mt-0.5 font-medium">{profile.meta.site}</dd>
          </div>
          <div>
            <dt className="text-[#5b6b77]">Netzbetreiber</dt>
            <dd className="mt-0.5 font-medium">{o.name}</dd>
          </div>
          <div>
            <dt className="text-[#5b6b77]">Netzebene</dt>
            <dd className="mt-0.5 font-medium">{o.voltageLevel}</dd>
          </div>
          <div>
            <dt className="text-[#5b6b77]">Stand</dt>
            <dd className="mt-0.5 font-medium">{DE_DATE.format(new Date(Date.UTC(year, 0, 1)))}</dd>
          </div>
        </dl>

        <table className="mt-7 w-full border-collapse">
          <tbody>
            <Row n={1} head="Flexible Anschlusskapazit&auml;t">
              {de(profile.meta.connectionMw, 1)} MW Bezugsleistung, die im Rahmen dieser
              Vereinbarung bereitgestellt wird.
            </Row>
            <Row n={2} head="Garantierte feste Leistung">
              {de(o.guaranteedMinimumMw, 1)} MW. Bezug bis zu dieser H&ouml;he wird zu keinem
              Zeitpunkt reduziert.
            </Row>
            <Row n={3} head="Limitierungsart und Ank&uuml;ndigung">
              {LIMIT_TYPE_LABEL[o.limitType]}, Obergrenze {de(o.capMw, 1)} MW.
              Ank&uuml;ndigungsfrist: {o.noticePeriod}.
            </Row>
            <Row n={4} head="Obergrenze der Reduzierung">
              H&ouml;chstens {de(o.maxCurtailmentHours)} Stunden je Kalenderjahr.
              {o.compensationAboveCap
                ? ' Dar&uuml;ber hinausgehende Reduzierungen werden entsch&auml;digt.'
                : ' Eine Entsch&auml;digung ist nicht vereinbart.'}
            </Row>
            <Row n={5} head="Erwartete Reduzierung (Anlage)">
              Rund {de(binding.hours)} Stunden im Jahr oberhalb der Obergrenze,{' '}
              {de(binding.energyMwh)} MWh bzw.{' '}
              {de((binding.energyMwh / profile.meta.annualMwh) * 100, 2)} % der Jahresarbeit;
              l&auml;ngste zusammenh&auml;ngende Reduzierung {de(binding.longestRunHours, 2)}{' '}
              Stunden. Informatorisch, auf Basis des analysierten Lastjahres.
            </Row>
            <Row n={6} head="Baukostenzuschuss">
              {de(o.bkzEurPerKw)} EUR je kW, insgesamt{' '}
              {de(o.bkzEurPerKw * profile.meta.connectionMw * 1000)} EUR.
            </Row>
            <Row n={7} head="Inbetriebnahme">
              Voraussichtlich {DE_DATE.format(energised)} ({de(o.monthsToConnect)} Monate), statt{' '}
              {de(o.monthsToFirm)} Monaten bis zur festen Anschlusskapazit&auml;t.
            </Row>
            <Row n={8} head="Umstellung auf festen Anschluss">
              Mit Abschluss des Netzausbaus, indikativ {DE_DATE.format(firm)}.
            </Row>
          </tbody>
        </table>

        <p className="mt-7 border-t border-[#d9dfe2] pt-4 text-[11.5px] leading-relaxed text-[#5b6b77]">
          Grundlage: analysiertes Lastprofil des Anschlussnehmers,{' '}
          {de(profile.meta.count)} Viertelstundenwerte.
          {chosen.amended
            ? ' Einzelne Konditionen wurden gegen&uuml;ber dem Angebot des Netzbetreibers angepasst.'
            : ''}{' '}
          Die Zahlen bilden ausschlie&szlig;lich das analysierte Lastjahr ab &mdash;{' '}
          <strong className="font-semibold">
            k&uuml;nftige Netzengp&auml;sse und das Abrufverhalten des Netzbetreibers sind nicht
            modelliert
          </strong>{' '}
          und m&uuml;ssen vertraglich abgesichert werden, nicht analytisch.
        </p>
      </article>
    </div>,
    document.body,
  )
}
