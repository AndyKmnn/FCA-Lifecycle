import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { District, Districts, Profile, Regions } from '../../data'
import { loadDistricts, loadProfile, loadRegions } from '../../data'
import { Label, Separator } from '../../design'
import type { SceneProps } from '../../shell/types'
import { UploadStrip } from '../scene2/UploadStrip'
import { resetTimelines, useTimeline } from '../scene2/useTimeline'
import { DistrictMap } from './DistrictMap'
import { EuropeMap } from './EuropeMap'
import { setSelectedDistrict } from './selection'

const UPLOAD_SEC = 3.2

/** Scripted beats, ms from the scene's start. */
const MARKS = [
  3400, // 1 upload finished - Europe is on screen, Germany picked out
  6000, // 2 zoom into Germany: the districts
  8000, // 3 district labels land, the presenter can pick one
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
  } | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => {
    setSelectedDistrict(null)
    resetTimelines()
    let live = true
    Promise.all([loadProfile(), loadRegions(), loadDistricts()]).then(
      ([profile, regions, districts]) => {
        if (live) setData({ profile, regions, districts })
      },
    )
    return () => {
      live = false
    }
  }, [])

  const stage = useTimeline(MARKS, 'scene1')

  if (!data) return <div className="h-full w-full" />

  const choose = (d: District) => {
    setPicked(d.id)
    setSelectedDistrict(d.id)
    window.setTimeout(onAdvance, 450)
  }

  const zoomed = stage >= 2

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <UploadStrip meta={data.profile.meta} uploaded={stage >= 1} durationSec={UPLOAD_SEC} />

      <div className="flex min-h-0 flex-1 items-stretch gap-12">
        <div className="flex w-[560px] shrink-0 flex-col justify-center">
          <span className="micro text-muted-foreground">Node screening</span>
          <h2 className="mt-4 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground">
            Where can this connect?
          </h2>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
            Public asset registers and grid expansion plans, screened into candidate nodes - and
            the operator whose district each one sits in.
          </p>

          {/* Covers the months-to-connect on the map: seeded demo values, not quotes. */}
          <Label kind="simulation" note="illustrative" className="mt-7 self-start" />

          <Separator className="mt-8" />

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
              zoomed ? { opacity: 0, scale: 1.9 } : { opacity: 1, scale: 1 }
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
              height={MAP_HEIGHT + 110}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
