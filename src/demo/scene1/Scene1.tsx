import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { District, Districts, Limits, Profile, Regions } from '../../data'
import { loadDistricts, loadLimits, loadProfile, loadRegions } from '../../data'
import { buildDistrictOffers } from '../scene2/districtOffers'
import { Separator } from '../../design'
import type { SceneProps } from '../../shell/types'
import { UploadStrip } from '../scene2/UploadStrip'
import { resetTimelines, useTimeline } from '../scene2/useTimeline'
import { DistrictMap } from './DistrictMap'
import { EuropeMap } from './EuropeMap'
import { setSelectedDistrict } from './selection'

const UPLOAD_SEC = 1

/** Scripted beats, ms from the scene's start. */
const MARKS = [
  1100, // 1 upload finished - Europe is on screen, Germany picked out
  1700, // 2 zoom into Germany: the districts
  2300, // 3 district labels land, the presenter can pick one
] as const

const MAP_HEIGHT = 560

/**
 * Scene 1 - Where can this connect. Owned by the demo12 track.
 *
 * The site's profile uploads, Europe resolves to Germany, and Germany resolves
 * to the grid operator districts that would write the connection. Clicking a
 * district records the choice and moves on to comparing their offers.
 */
export default function Scene1({ onAdvance }: SceneProps) {
  const [data, setData] = useState<{
    profile: Profile
    regions: Regions
    districts: Districts
    limits: Limits
  } | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  /** Nothing moves until the presenter has put a profile in. */
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    setSelectedDistrict(null)
    resetTimelines()
    let live = true
    Promise.all([loadProfile(), loadRegions(), loadDistricts(), loadLimits()]).then(
      ([profile, regions, districts, limits]) => {
        if (live) setData({ profile, regions, districts, limits })
      },
    )
    return () => {
      live = false
    }
  }, [])

  /**
   * Where each district's cost of the cap falls between the cheapest and the
   * dearest, which is what colours the map.
   *
   * The same engine scene 2 uses, so the map and the cards can never disagree.
   * Banded on distinct costs rather than on rank: two districts that write the
   * same cap cost the same and are coloured the same, which is the honest
   * answer even though it leaves the four districts in three colours.
   */
  const heat = useMemo(() => {
    if (!data) return undefined
    const offers = buildDistrictOffers(data.profile, data.limits, data.districts)
    const distinct = [...new Set(offers.map((o) => o.result.costEur))].sort((a, b) => a - b)
    const out: Record<string, number> = {}
    for (const o of offers)
      out[o.district.id] =
        distinct.length <= 1 ? 0 : distinct.indexOf(o.result.costEur) / (distinct.length - 1)
    return out
  }, [data])

  const started = fileName !== null
  const stage = useTimeline(MARKS, 'scene1', data !== null && started)

  if (!data) return <div className="h-full w-full" />

  const choose = (d: District) => {
    setPicked(d.id)
    setSelectedDistrict(d.id)
    window.setTimeout(onAdvance, 450)
  }

  const zoomed = stage >= 2

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <UploadStrip
        profile={data.profile}
        uploaded={stage >= 1}
        durationSec={UPLOAD_SEC}
        fileName={fileName}
        onPick={setFileName}
      />

      <div className="flex min-h-0 flex-1 items-stretch gap-12">
        <div className="flex w-[560px] shrink-0 flex-col justify-center">
          <span className="micro text-muted-foreground">Node screening</span>
          <h2 className="mt-4 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground">
            Where can this connect?
          </h2>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
            {started
              ? 'Public asset registers and grid expansion plans, screened into candidate nodes - and the operator whose district each one sits in.'
              : "Start with the site's own year of 15-minute meter data. Everything after it - which cap the site can live with, and what that cap costs - is read off this one file."}
          </p>

          <Separator className="mt-9" />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={stage >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8"
          >
            <div className="text-lg text-muted-foreground">
              Four operators would write this connection, on different terms and different
              timelines.
            </div>
            <p className="mt-5 text-base font-medium text-foreground">
              Click a district to compare what they offer.
            </p>

            <div className="mt-6 flex items-center gap-4 text-[12px] text-muted-foreground">
              <span className="micro">Cost of the cap</span>
              <span className="inline-flex items-center gap-2">
                <Swatch color="var(--chart-4)" /> lowest
              </span>
              <span className="inline-flex items-center gap-2">
                <Swatch color="var(--chart-5)" /> middle
              </span>
              <span className="inline-flex items-center gap-2">
                <Swatch color="var(--destructive)" /> highest
              </span>
            </div>
          </motion.div>

          <p className="mt-auto pt-8 text-[12px] text-muted-foreground">
            Outlines: Natural Earth (public domain) and deutschlandGeoJSON (The Unlicense),
            derived from DIVA-GIS country data.
          </p>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={
              !started
                ? { opacity: 0, scale: 0.98 }
                : zoomed
                  ? { opacity: 0, scale: 1.9 }
                  : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ pointerEvents: 'none' }}
          >
            <EuropeMap height={MAP_HEIGHT} />
          </motion.div>

          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={zoomed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <DistrictMap
              regions={data.regions}
              districts={data.districts}
              showLabels={stage >= 3}
              selectedId={picked}
              onSelect={choose}
              heat={stage >= 3 ? heat : undefined}
              height={MAP_HEIGHT + 110}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/** One band of the map's cost scale. */
function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="h-2.5 w-4 rounded-[2px] border border-border"
      style={{ background: color, opacity: 0.55 }}
    />
  )
}
