import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Profile } from '../../data'
import { loadProfile } from '../../data'
import { Button, Chip, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'
import { KREISE } from './germanyKreise'
import { OperatorDetail } from './OperatorDetail'
import { OperatorList } from './OperatorList'
import { getTarget, setChosen } from './selection'
import { UploadStrip } from './UploadStrip'
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
 * On what terms.
 *
 * The site finder before this answers where the load can go; this answers what
 * it costs to put it there. The two used to overlap - both carried a map of the
 * Kreise, both talked about the cap - which made the demo feel like it asked
 * the same question twice. There is no map here now: the place has been chosen,
 * and this is the negotiation.
 *
 * It opens on whatever the site finder settled on, and reads the terms as of
 * the year that requirement asked for, so a shortlist drawn up for 2029 is
 * priced for 2029 rather than for today.
 */
export default function Scene1({ onAdvance }: SceneProps) {
  const [data, setData] = useState<{ profile: Profile; file: OperatorFile } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([loadProfile(), loadOperators()])
      .then(([profile, file]) => {
        if (live) setData({ profile, file })
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
  return <Terms {...data} onAdvance={onAdvance} />
}

function Terms({
  profile,
  file,
  onAdvance,
}: {
  profile: Profile
  file: OperatorFile
  onAdvance: () => void
}) {
  /** Read once: the site finder is not running while this scene is up. */
  const target = useMemo(() => getTarget(), [])

  const [fileName, setFileName] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortKey>('months')
  const [selectedId, setSelectedId] = useState<string | null>(
    target?.kreisId ?? file.meta.homeId,
  )
  const [amendments, setAmendments] = useState<Amendments>(() => new Map())

  const started = fileName !== null
  const year = target?.byYear ?? BASE_YEAR

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

  const rows = useMemo(
    () => applyFilters(projected, filters, sort, amendments),
    [projected, filters, sort, amendments],
  )

  const amendedIds = useMemo(() => new Set(amendments.keys()), [amendments])

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

  // Hand the settled terms to the scene that holds the cap and prints them.
  useEffect(() => {
    setChosen(
      selected
        ? { operator: selected, amended: selectedId ? amendments.has(selectedId) : false, year }
        : null,
    )
  }, [selected, selectedId, amendments, year])

  const targetKreis = target ? KREISE.find((k) => k.id === target.kreisId)?.name : null

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
          <div className="flex w-[460px] shrink-0 flex-col gap-3">
            {target ? (
              <div className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
                <Chip selected>{targetKreis ?? target.kreisId}</Chip>
                <span>
                  from the shortlist &middot; {target.mw} MW by {target.byYear}
                </span>
              </div>
            ) : null}
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
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4">
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
          <div className="w-[760px]">
            <span className="micro text-muted-foreground">FCA structuring</span>
            <h2 className="mt-4 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground">
              On what terms?
            </h2>
            <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
              {targetKreis
                ? `${targetKreis} can take the load. What it costs to put it there is read off the site's own year of 15-minute meter data: the cap, the hours it binds, and what those hours are worth.`
                : "The site's own year of 15-minute meter data decides what a cap is worth: how many hours it binds, how much energy that is, and what the operator should be asked for instead."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
