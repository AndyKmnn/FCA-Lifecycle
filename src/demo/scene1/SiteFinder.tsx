import { useEffect, useMemo, useState } from 'react'
import { Button, CHART, Chip, Separator, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'
import { EuropeMap } from './EuropeMap'
import { KreisMap } from './KreisMap'
import { NodeMap } from './NodeMap'
import { accessOf, ACCESS_LABEL, EUROPE_CONTEXT } from './europe'
import { KREISE } from './germanyKreise'
import { loadOperators, type Operator, type OperatorFile } from './operators'
import { setTarget } from './selection'
import {
  DEFAULT_REQUIREMENT,
  effectiveHeadroom,
  queuePosition,
  shortlist,
  type Candidate,
  type GridNode,
  type NodeFile,
  type Requirement,
} from './siting'

/**
 * Where to build.
 *
 * Three steps down, each answering a different question off a different layer
 * of the data, and each narrower than the one above:
 *
 *   Europe  - is this market open at all? The only layer drawn from public
 *             record, because the top of the funnel is the part that can be
 *             checked and fabricating it would give away the part that cannot.
 *   Germany - which Kreis can take this load by the date, given how its
 *             operator and its nodes will stand in that year?
 *   the node - which connection point, and who is already standing in front of
 *             you at it? Free capacity per node becomes public in 2028. The
 *             queue never does.
 */

const BASE_YEAR = 2026
const HORIZON = 2032

type Level = 'europe' | 'germany' | 'node'

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="micro text-muted-foreground">{label}</span>
        <span className="tabular text-[15px] font-semibold text-foreground">
          {value}
          <span className="ml-1 font-mono text-[11px] text-muted-foreground">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-5 w-full cursor-pointer accent-[var(--foreground)]"
      />
    </label>
  )
}

function Crumb({
  children,
  onClick,
  current,
}: {
  children: React.ReactNode
  onClick?: () => void
  current?: boolean
}) {
  if (current)
    return <span className="text-[13px] font-semibold text-foreground">{children}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </button>
  )
}

export default function SiteFinder({ onAdvance }: SceneProps) {
  const [data, setData] = useState<{ file: OperatorFile; nodes: GridNode[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([
      loadOperators(),
      fetch(`${import.meta.env.BASE_URL}data/nodes.json`).then((r) => {
        if (!r.ok) throw new Error(`nodes.json: ${r.status}`)
        return r.json() as Promise<NodeFile>
      }),
    ])
      .then(([file, nodeFile]) => {
        if (live) setData({ file, nodes: nodeFile.nodes })
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      live = false
    }
  }, [])

  if (error)
    return (
      <Surface className="flex h-full w-full items-center justify-center p-16">
        <p className="text-xl text-muted-foreground">Could not load the data: {error}</p>
      </Surface>
    )
  if (!data) return <div className="h-full w-full" />
  return <Finder file={data.file} nodes={data.nodes} onAdvance={onAdvance} />
}

function Finder({
  file,
  nodes,
  onAdvance,
}: {
  file: OperatorFile
  nodes: GridNode[]
  onAdvance: () => void
}) {
  const [req, setReq] = useState<Requirement>(DEFAULT_REQUIREMENT)
  const [level, setLevel] = useState<Level>('europe')
  const [country, setCountry] = useState<string | null>(null)
  const [kreisId, setKreisId] = useState<string | null>(null)
  const [nodeId, setNodeId] = useState<string | null>(null)

  const set = (patch: Partial<Requirement>) => setReq({ ...req, ...patch })

  const { candidates, passing } = useMemo(
    () => shortlist(file.operators, nodes, req, BASE_YEAR),
    [file.operators, nodes, req],
  )

  const byKreis = useMemo(() => {
    const m = new Map<string, Candidate>()
    for (const c of candidates) m.set(c.kreisId, c)
    return m
  }, [candidates])

  /** The map takes its colours from the shortlist, not from the operator. */
  const fills = useMemo(() => {
    const m = new Map<string, { fill: string; opacity: number }>()
    for (const c of candidates) {
      m.set(
        c.kreisId,
        c.blocker === 'none' ? { fill: CHART.ok, opacity: 0.62 }
        : c.blocker === 'no-room' ? { fill: 'var(--destructive)', opacity: 0.3 }
        : c.blocker === 'too-slow' ? { fill: CHART.warn, opacity: 0.3 }
        : c.blocker === 'too-curtailed' ? { fill: CHART.series, opacity: 0.22 }
        : { fill: 'var(--muted)', opacity: 0.3 },
      )
    }
    return m
  }, [candidates])

  const kreisNodes = useMemo(
    () => (kreisId ? nodes.filter((n) => n.kreisId === kreisId) : []),
    [kreisId, nodes],
  )
  const node = nodeId ? (kreisNodes.find((n) => n.id === nodeId) ?? null) : null
  const kreisName = kreisId ? (KREISE.find((k) => k.id === kreisId)?.name ?? kreisId) : null
  const selectedCandidate = kreisId ? (byKreis.get(kreisId) ?? null) : null

  // Hand the choice to the terms scene, which opens on it.
  useEffect(() => {
    setTarget(kreisId ? { kreisId, nodeId, byYear: req.byYear, mw: req.mw } : null)
  }, [kreisId, nodeId, req.byYear, req.mw])

  const openKreis = (id: string) => {
    setKreisId(id)
    const first = nodes.filter((n) => n.kreisId === id)
    setNodeId(first.length ? first[0].id : null)
    setLevel('node')
  }

  const emptyOperators = useMemo(() => new Map<string, Operator>(), [])

  return (
    <div className="flex h-full w-full gap-5">
      {/* ------------------------------------------------ the requirement */}
      <Surface className="flex w-[330px] shrink-0 flex-col p-5">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
          What the load needs
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          No site yet. Start from the requirement and let the grid say where it can go.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <Slider
            label="Capacity"
            value={req.mw}
            min={2}
            max={150}
            step={1}
            unit="MW"
            onChange={(v) => set({ mw: v })}
          />
          <Slider
            label="Power needed by"
            value={req.byYear}
            min={BASE_YEAR}
            max={HORIZON}
            step={1}
            unit=""
            onChange={(v) => set({ byYear: v })}
          />
          <Slider
            label="Curtailment tolerated"
            value={req.curtailmentHours}
            min={0}
            max={2000}
            step={50}
            unit="h/yr"
            onChange={(v) => set({ curtailmentHours: v })}
          />
        </div>

        <button
          type="button"
          onClick={() => set({ countQueue: !req.countQueue })}
          aria-pressed={req.countQueue}
          className={`mt-4 rounded-md border px-3 py-2 text-left text-[12px] leading-snug outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
            req.countQueue
              ? 'border-primary/60 bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground'
          }`}
        >
          <span className="font-medium">Count what is already queued</span>
          <br />
          Applications filed and not yet built, weighted for how likely they are to.
        </button>

        <Separator className="my-5" />

        <div>
          <span className="micro text-muted-foreground">Places in Germany that fit</span>
          <p className="tabular mt-1 text-[44px] leading-none font-semibold tracking-[-0.03em] text-foreground">
            {passing.length}
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            of {file.operators.length} Kreise, by {req.byYear}
          </p>
        </div>

        <p className="mt-auto pt-5 text-[12px] leading-relaxed text-muted-foreground">
          Europe is drawn from public record. Free capacity per node becomes public in Germany
          on 1 January 2028; the queue standing at each node never does.
        </p>
      </Surface>

      {/* ------------------------------------------------------- the map */}
      <Surface className="flex min-h-0 flex-1 flex-col p-5">
        <div className="flex shrink-0 items-center gap-2">
          <Crumb onClick={() => setLevel('europe')} current={level === 'europe'}>
            Europe
          </Crumb>
          <span className="text-muted-foreground">&rsaquo;</span>
          <Crumb
            onClick={() => {
              setCountry('DE')
              setLevel('germany')
            }}
            current={level === 'germany'}
          >
            Germany
          </Crumb>
          {kreisName ? (
            <>
              <span className="text-muted-foreground">&rsaquo;</span>
              <Crumb current={level === 'node'}>{kreisName}</Crumb>
            </>
          ) : null}
        </div>

        <div className="mt-4 min-h-0 flex-1">
          {level === 'europe' ? (
            <EuropeMap
              selected={country}
              onSelect={(code) => {
                setCountry(code)
                if (code === 'DE') setLevel('germany')
              }}
            />
          ) : level === 'germany' ? (
            <KreisMap
              operators={emptyOperators}
              matched={new Set(candidates.map((c) => c.kreisId))}
              selectedId={kreisId}
              onSelect={openKreis}
              fills={fills}
            />
          ) : kreisId ? (
            <NodeMap
              kreisId={kreisId}
              nodes={kreisNodes}
              selectedId={nodeId}
              onSelect={setNodeId}
              requiredMw={req.mw}
              countQueue={req.countQueue}
            />
          ) : null}
        </div>

        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[12px] text-muted-foreground">
          {level === 'europe' ? (
            <>
              <Dot color={CHART.ok} /> flexible connections in force
              <Dot color={CHART.warn} /> published constraint
              <Dot color="var(--destructive)" /> effectively closed
              <Dot color="var(--muted)" /> not assessed
            </>
          ) : level === 'germany' ? (
            <>
              <Dot color={CHART.ok} /> fits the requirement
              <Dot color="var(--destructive)" /> no room at any node
              <Dot color={CHART.warn} /> queue too long
              <Dot color={CHART.series} /> curtails more than the load can take
              <Dot color="var(--muted)" /> no flexible connection offered
            </>
          ) : (
            <>
              <Dot color={CHART.ok} /> enough room
              <Dot color="var(--destructive)" /> too small
              <span>Larger dot = transmission level</span>
            </>
          )}
        </div>
      </Surface>

      {/* --------------------------------------------------- the context */}
      <Surface className="flex min-h-0 w-[400px] shrink-0 flex-col">
        {level === 'europe' ? (
          <CountryPanel code={country} />
        ) : level === 'germany' ? (
          <ShortlistPanel passing={passing} onOpen={openKreis} req={req} />
        ) : (
          <NodePanel
            node={node}
            candidate={selectedCandidate}
            req={req}
            onAdvance={onAdvance}
          />
        )}
      </Surface>
    </div>
  )
}

const Dot = ({ color }: { color: string }) => (
  <span
    aria-hidden
    className="inline-block h-2.5 w-2.5 rounded-full border border-border"
    style={{ background: color, opacity: 0.7 }}
  />
)

function CountryPanel({ code }: { code: string | null }) {
  if (!code)
    return (
      <div className="flex min-h-0 flex-col p-5">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
          {EUROPE_CONTEXT.headline}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          {EUROPE_CONTEXT.detail}
        </p>
        <p className="mt-5 text-[13px] text-muted-foreground">
          Pick a country. Four are researched; the rest are grey because we have not checked
          them, which is what makes the four worth believing.
        </p>
      </div>
    )

  const a = accessOf(code)
  return (
    <div className="flex min-h-0 flex-col overflow-y-auto p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">{a.name}</h3>
        <Chip tone={a.access === 'unassessed' ? 'default' : 'accent'} className="shrink-0">
          {ACCESS_LABEL[a.access]}
        </Chip>
      </div>
      <p className="mt-3 text-[15px] leading-snug font-medium text-foreground">{a.headline}</p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{a.detail}</p>
      {a.source ? (
        <p className="mt-4 text-[12px] text-muted-foreground">
          Source:{' '}
          <a
            href={a.source.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {a.source.label}
          </a>
        </p>
      ) : null}
      {code === 'DE' ? (
        <p className="mt-5 text-[13px] text-muted-foreground">
          Germany is the one we have taken all the way down. Click it on the map to go to the
          Kreise.
        </p>
      ) : null}
    </div>
  )
}

function ShortlistPanel({
  passing,
  onOpen,
  req,
}: {
  passing: Candidate[]
  onOpen: (id: string) => void
  req: Requirement
}) {
  return (
    <>
      <div className="shrink-0 p-5 pb-3">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
          Shortlist
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {req.mw} MW by {req.byYear}, soonest first.
        </p>
      </div>
      <Separator className="shrink-0" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {passing.length === 0 ? (
          <p className="p-5 text-[14px] leading-relaxed text-muted-foreground">
            Nowhere in Germany fits. Give it more time, take less capacity, or accept a node
            that is already spoken for.
          </p>
        ) : (
          passing.slice(0, 60).map((c, i) => (
            <button
              key={c.kreisId}
              type="button"
              onClick={() => onOpen(c.kreisId)}
              className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-x-3 border-b border-border px-5 py-3 text-left outline-none last:border-b-0 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="tabular text-[12px] text-muted-foreground">{i + 1}</span>
              <span className="truncate text-[14px] font-medium text-foreground">
                {c.operator.kreis}
              </span>
              <span className="tabular text-[13px] text-muted-foreground">
                {c.monthsToConnect} mo
              </span>
              <span />
              <span className="truncate text-[12px] text-muted-foreground">{c.node.name}</span>
              <span className="tabular text-[12px] text-muted-foreground">
                {c.headroom.toFixed(1)} MW
              </span>
            </button>
          ))
        )}
      </div>
    </>
  )
}

function NodePanel({
  node,
  candidate,
  req,
  onAdvance,
}: {
  node: GridNode | null
  candidate: Candidate | null
  req: Requirement
  onAdvance: () => void
}) {
  if (!node)
    return (
      <div className="flex min-h-0 items-center justify-center p-8">
        <p className="text-center text-[14px] text-muted-foreground">
          Pick a connection point on the map.
        </p>
      </div>
    )

  const room = effectiveHeadroom(node, req.countQueue)
  const pos = queuePosition(node)
  const fits = room >= req.mw

  return (
    <>
      <div className="shrink-0 p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[19px] font-semibold tracking-[-0.02em] text-foreground">
              {node.name}
            </h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{node.voltageLevel}</p>
          </div>
          <Chip tone={fits ? 'accent' : 'default'} className="shrink-0">
            {fits ? 'Fits' : 'Too small'}
          </Chip>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Figure label="Free capacity" value={node.headroomMw.toFixed(1)} unit="MW" />
          <Figure
            label="Applied for"
            value={node.queuedMw.toFixed(0)}
            unit="MW"
            muted="not yet built"
          />
        </div>
      </div>

      <Separator className="shrink-0" />

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <span className="micro text-muted-foreground">The queue at this node</span>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          Germany publishes no connection queue. Every applicant may ask for their own rank -
          this is what those answers add up to.
        </p>

        <div className="mt-3 flex flex-col">
          {node.queue.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing queued here.</p>
          ) : (
            node.queue.map((q, i) => (
              <div
                key={`${q.filed}-${i}`}
                className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0"
              >
                <span className="tabular w-4 shrink-0 text-[12px] text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  {q.label}
                  {q.speculative ? (
                    <span className="ml-2 text-[11px] text-warn">speculative</span>
                  ) : null}
                </span>
                <span className="tabular shrink-0 text-[12px] text-muted-foreground">
                  {q.mw} MW · {q.filed}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 rounded-md border border-border bg-muted/50 px-3 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-foreground">Where you would land</span>
            <span className="tabular text-[13px] font-semibold text-foreground">
              #{pos.today}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">
              Under the § 17b priority rules
            </span>
            <span className="tabular text-[13px] font-semibold text-ok">
              #{pos.underReform}
            </span>
          </div>
          {pos.underReform < pos.today ? (
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              {pos.today - pos.underReform} filing
              {pos.today - pos.underReform === 1 ? '' : 's'} ahead of you have nothing behind
              them. The draft law moves firm offtake to the front.
            </p>
          ) : null}
        </div>

        {candidate && candidate.blocker === 'none' ? (
          <Button size="lg" className="mt-5 w-full" onClick={onAdvance}>
            Take this node
          </Button>
        ) : null}
      </div>
    </>
  )
}

function Figure({
  label,
  value,
  unit,
  muted,
}: {
  label: string
  value: string
  unit: string
  muted?: string
}) {
  return (
    <div className="rounded-md border border-border px-3 py-2.5">
      <span className="micro text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="tabular text-[22px] leading-none font-semibold text-foreground">
          {value}
        </span>
        <span className="font-mono text-[12px] text-muted-foreground">{unit}</span>
      </div>
      {muted ? <span className="text-[11px] text-muted-foreground">{muted}</span> : null}
    </div>
  )
}
