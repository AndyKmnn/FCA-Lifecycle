import { useEffect, useState } from 'react'
import type { Profile } from '../../data'
import { Button } from '../../design'
import type { Operator } from '../scene1/operators'

/**
 * The other side of the glass: the operator's connection portal, and the
 * application arriving in it.
 *
 * This is the product's whole claim in one picture. The customer half of a
 * flexible connection agreement is computable, and once it is computed there is
 * a structured request to hand over rather than a PDF attached to an email that
 * somebody retypes. Showing the operator their own screen is the strongest
 * thing this demo does in front of an operator: they stop assessing a pitch and
 * start assessing a workflow.
 *
 * What it is not: a live integration. Section 17e digital connection portals
 * are in the Netzanschlusspaket, which is a draft. Nothing here says a request
 * was transmitted or that a real operator replied - the operator is fictional
 * and the portal is ours. When somebody asks, the answer is that today this
 * produces the application pack and the adapter is what we build next.
 */

type Stage = 'idle' | 'sending' | 'queued' | 'approved'

/** Long enough to read the payload, short enough not to be a wait. */
const SEND_MS = 900

/** Stable per site and operator - the same demo always shows the same file number. */
function reference(operator: Operator, year: number): string {
  let h = 0
  for (const c of operator.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const kreis = operator.id.split('-')[1]?.slice(0, 2).toUpperCase() ?? 'XX'
  return `FCA-${year}-${operator.state}${kreis}-${String(h % 10000).padStart(4, '0')}`
}

export interface SubmissionProps {
  operator: Operator
  profile: Profile
  year: number
  /** The reference, lifted so the document can stamp itself. */
  onApproved: (ref: string) => void
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-[#5b6b77]">{k}</span>
      <span className="tabular text-right font-medium text-[#1f2a33]">{v}</span>
    </div>
  )
}

export function Submission({ operator, profile, year, onApproved }: SubmissionProps) {
  const [stage, setStage] = useState<Stage>('idle')
  const ref = reference(operator, year)

  useEffect(() => {
    if (stage !== 'sending') return
    const id = window.setTimeout(() => setStage('queued'), SEND_MS)
    return () => window.clearTimeout(id)
  }, [stage])

  const n = (v: number, d = 0) =>
    v.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d })

  /** What actually goes over the wire, if there were a wire. */
  const payload = [
    `POST /netzanschluss/flexibel`,
    `{`,
    `  "aktenzeichen": "${ref}",`,
    `  "anschlussnehmer": "${profile.meta.site}",`,
    `  "netzebene": "${operator.voltageLevel}",`,
    `  "anschlussleistung_mw": ${profile.meta.connectionMw},`,
    `  "lastgang": { "werte": ${profile.meta.count}, "aufloesung_min": 15 },`,
    `  "vorschlag": {`,
    `    "obergrenze_mw": ${operator.capMw},`,
    `    "feste_leistung_mw": ${operator.guaranteedMinimumMw},`,
    `    "limitierung": "${operator.limitType}"`,
    `  }`,
    `}`,
  ].join('\n')

  if (stage === 'idle') {
    return (
      <aside className="no-print w-[380px] shrink-0">
        <div className="sticky top-24 rounded-lg border border-[#d9dfe2] bg-white p-5">
          <h3 className="text-[15px] font-semibold text-[#1f2a33]">Submit to the operator</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5b6b77]">
            The application goes over structured - load profile, connection capacity and the
            proposed cap - not a PDF attached to an email.
          </p>
          <Button className="mt-4 w-full" onClick={() => setStage('sending')}>
            Submit application
          </Button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="no-print w-[380px] shrink-0">
      <div className="sticky top-24 overflow-hidden rounded-lg border border-[#1f2a33] bg-white">
        <header className="border-b border-[#d9dfe2] bg-[#1f2a33] px-4 py-2.5">
          <p className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">
            The operator&rsquo;s screen
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-white">{operator.name}</p>
          <p className="text-[11px] text-white/70">Connection portal &middot; Inbox</p>
        </header>

        {stage === 'sending' ? (
          <div className="p-4">
            <p className="text-[12px] text-[#5b6b77]">Submitting &hellip;</p>
            <pre className="mt-2 overflow-x-auto rounded border border-[#e5e9ec] bg-[#f7f9fa] p-3 font-mono text-[10.5px] leading-relaxed text-[#1f2a33]">
              {payload}
            </pre>
          </div>
        ) : (
          <div className="p-4">
            <div
              className={`rounded border px-3 py-3 ${
                stage === 'approved' ? 'border-[#12705a] bg-[#12705a]/5' : 'border-[#f5a623]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[12px] font-medium text-[#1f2a33]">{ref}</span>
                <span
                  className={`text-[11px] font-semibold ${
                    stage === 'approved' ? 'text-[#12705a]' : 'text-[#a64b00]'
                  }`}
                >
                  {stage === 'approved' ? 'approved' : 'new'}
                </span>
              </div>

              <p className="mt-1.5 text-[13px] font-medium text-[#1f2a33]">{profile.meta.site}</p>

              <div className="mt-2.5 border-t border-[#e5e9ec] pt-2 text-[12px]">
                <Line
                  k="Connection capacity"
                  v={`${n(profile.meta.connectionMw, 1)} MW`}
                />
                <Line
                  k="Load profile"
                  v={`${n(profile.meta.count)} × 15 min`}
                />
                <Line k="Peak" v={`${n(profile.meta.peakMw, 2)} MW`} />
                <Line
                  k="Proposed cap"
                  v={`${n(operator.capMw, 1)} MW`}
                />
                <Line
                  k="Firm level"
                  v={`${n(operator.guaranteedMinimumMw, 1)} MW`}
                />
                <Line
                  k="Headroom at node"
                  v={`${n(operator.headroomMw, 1)} MW`}
                />
              </div>

              {stage === 'queued' ? (
                <>
                  <p className="mt-3 text-[11px] text-[#5b6b77]">
                    The operator reviews it against the node and decides:
                  </p>
                  <div className="mt-1.5 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setStage('approved')
                        onApproved(ref)
                      }}
                    >
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      Query
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-[12px] leading-relaxed text-[#12705a]">
                  Agreement issued. First daily limits from energisation in{' '}
                  {n(operator.monthsToConnect)} months.
                </p>
              )}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-[#5b6b77]">
              Only the operator knows the headroom at the node, which is why the decision is
              theirs and not ours.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
