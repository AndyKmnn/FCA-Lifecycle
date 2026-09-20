import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Profile, Regions } from '../../data'
import { loadProfile, loadRegions } from '../../data'
import { Button, CHART, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'
import { UploadStrip } from './UploadStrip'
import { project } from './germanyStates'
import { setChosen } from './selection'
import { KreisMap } from './KreisMap'
import { OperatorDetail } from './OperatorDetail'
import { OperatorList } from './OperatorList'
import {
  applyFilters,
  BASE_YEAR,
  DEFAULT_FILTERS,
  loadOperators,
  operatorAt,
  withAmendment,
  type Amendments,
  type Filters,
  type Operator,
  type OperatorFile,
  type SortKey,
} from './operators'

const UPLOAD_SEC = 1

/**
 * The connection explorer: where this site can connect, and on what terms.
 *
 * Three panes that all move together. The filters narrow the database, the map
 * repaints to whatever survived, and the detail panel takes the terms apart and
 * lets them be rewritten - with the hours, the megawatt-hours and the euros
 * recomputing against the site's own profile as they are.
 *
 * This replaced two scenes. The old scene 1 was a map of four operator
 * districts with nothing to do on it; the old scene 2 dealt four cards and
 * typed a term sheet. Neither let anybody ask their own question, which is the
 * only thing a room full of connection seekers wants to do.
 */
export default function Scene1({ onAdvance }: SceneProps) {
  const [data, setData] = useState<{
    profile: Profile
    regions: Regions
    file: OperatorFile
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([loadProfile(), loadRegions(), loadOperators()])
      .then(([profile, regions, file]) => {
        if (live) setData({ profile, regions, file })
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
  return <Explorer {...data} onAdvance={onAdvance} />
}

function Explorer({
  profile,
  regions,
  file,
  onAdvance,
}: {
  profile: Profile
  regions: Regions
  file: OperatorFile
  onAdvance: () => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortKey>('months')
  const [selectedId, setSelectedId] = useState<string | null>(file.meta.homeId)
  const [amendments, setAmendments] = useState<Amendments>(() => new Map())
  const [year, setYear] = useState(BASE_YEAR)

  const started = fileName !== null

  /**
   * The country as it stands in the chosen year, before anything the presenter
   * has typed over the top. Everything downstream reads this, so moving the
   * year moves the map, the list and the detail panel together.
   */
  const projected = useMemo(
    () => file.operators.map((o) => operatorAt(o, year)),
    [file.operators, year],
  )

  const byId = useMemo(() => {
    const m = new Map<string, Operator>()
    for (const o of projected) m.set(o.id, withAmendment(o, amendments))
    return m
  }, [projected, amendments])

  const originals = useMemo(() => {
    const m = new Map<string, Operator>()
    for (const o of projected) m.set(o.id, o)
    return m
  }, [projected])

  const offering = useMemo(() => projected.filter((o) => o.offersFca).length, [projected])

  const rows = useMemo(
    () => applyFilters(projected, filters, sort, amendments),
    [projected, filters, sort, amendments],
  )

  const matched = useMemo(() => new Set(rows.map((o) => o.id)), [rows])
  const amendedIds = useMemo(() => new Set(amendments.keys()), [amendments])

  const site = useMemo(() => project(regions.site.lon, regions.site.lat), [regions.site])

  const amend = useCallback(
    (patch: Partial<Operator>) => {
      if (!selectedId) return
      setAmendments((current) => {
        const next = new Map(current)
        next.set(selectedId, { ...next.get(selectedId), ...patch })
        return next
      })
    },
    [selectedId],
  )

  const resetSelected = useCallback(() => {
    if (!selectedId) return
    setAmendments((current) => {
      const next = new Map(current)
      next.delete(selectedId)
      return next
    })
  }, [selectedId])

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null
  const original = selectedId ? (originals.get(selectedId) ?? null) : null

  // Hand the choice to the next scene, which prints it.
  useEffect(() => {
    setChosen(
      selected
        ? { operator: selected, amended: selectedId ? amendments.has(selectedId) : false, year }
        : null,
    )
  }, [selected, selectedId, amendments, year])

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <UploadStrip
        profile={profile}
        uploaded={started}
        durationSec={UPLOAD_SEC}
        fileName={fileName}
        onPick={setFileName}
      />

      {started ? (
        <div className="flex min-h-0 flex-1 gap-5">
          <OperatorList
            rows={rows}
            total={file.operators.length}
            filters={filters}
            sort={sort}
            selectedId={selectedId}
            amendedIds={amendedIds}
            onFilters={setFilters}
            onSort={setSort}
            onSelect={setSelectedId}
          />

          <Surface className="flex min-h-0 w-[620px] shrink-0 flex-col p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                Where it can connect
              </h3>
              <span className="tabular text-[13px] text-muted-foreground">
                {matched.size} Kreise
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span className="micro">Connected in</span>
              <Swatch color={CHART.ok} /> under a year
              <Swatch color={CHART.warn} /> under two
              <Swatch color="var(--destructive)" /> longer
              <Swatch color="var(--muted)" /> no FCA
            </div>

            <div className="mt-4 shrink-0 rounded-md border border-border bg-muted px-3 py-2.5">
              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="micro text-muted-foreground">
                    The country as it stands in
                  </span>
                  <span className="tabular text-[17px] leading-none font-semibold text-foreground">
                    {year}
                  </span>
                </span>
                <input
                  type="range"
                  min={BASE_YEAR}
                  max={file.meta.horizonYear}
                  step={1}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1 h-5 w-full cursor-pointer accent-[var(--foreground)]"
                  aria-label="Year"
                />
                <span className="flex justify-between text-[10px] text-muted-foreground">
                  <span className="tabular">{BASE_YEAR}</span>
                  <span>Netzanschlusspaket</span>
                  <span>section 14a</span>
                  <span className="tabular">{file.meta.horizonYear}</span>
                </span>
              </label>
              <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                <span className="tabular">{offering}</span> of {file.operators.length} write an
                FCA{year > BASE_YEAR ? ` by ${year}` : ' today'}. This moves the operators
                themselves - not which of them you are looking at.
              </p>
            </div>

            <div className="mt-3 min-h-0 flex-1">
              <KreisMap
                operators={byId}
                matched={matched}
                selectedId={selectedId}
                onSelect={setSelectedId}
                site={site}
                homeId={file.meta.homeId}
              />
            </div>
          </Surface>

          <div className="flex min-h-0 flex-col gap-4">
            <OperatorDetail
              operator={selected}
              original={original}
              corpus={projected}
              profile={profile}
              amended={selectedId ? amendments.has(selectedId) : false}
              onAmend={amend}
              onReset={resetSelected}
            />
            <Button size="xl" onClick={onAdvance} className="shrink-0">
              See it operate
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center">
          <div className="w-[720px]">
            <span className="micro text-muted-foreground">Node screening</span>
            <h2 className="mt-4 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground">
              Where can this connect?
            </h2>
            <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
              Start with the site&rsquo;s own year of 15-minute meter data. Everything after it -
              which of the operators would write this connection, what cap each would set, and
              what that cap costs - is read off this one file.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-4 rounded-[2px] border border-border"
      style={{ background: color, opacity: 0.55 }}
    />
  )
}
