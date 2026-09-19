import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Regions } from '../../data'
import { loadRegions } from '../../data'
import { Counter, Label, Separator, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'
import { HeadroomMap } from './HeadroomMap'
import { HEADROOM_RAMP, headroomOpacity } from './headroomScale'

const MAP_HEIGHT = 780

/**
 * Scene 1 - Headroom map (10 s). Owned by the demo12 track.
 * Germany's federal states shaded by the proxy headroom score in
 * public/data/regions.json. Bavaria lights up, the site pin pulses,
 * clicking the pin advances the demo.
 */
export default function Scene1({ onAdvance }: SceneProps) {
  const [data, setData] = useState<Regions | null>(null)

  useEffect(() => {
    let live = true
    loadRegions().then((r) => {
      if (live) setData(r)
    })
    return () => {
      live = false
    }
  }, [])

  if (!data) return <div className="h-full w-full" />

  const site = data.site
  const siteRegion = data.regions.find((r) => r.code === site.state)

  return (
    <div className="flex h-full w-full items-stretch gap-16">
      <div className="flex w-[760px] shrink-0 flex-col justify-center">
        <span className="micro text-muted-foreground">Node screening</span>
        <h2 className="mt-4 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground">
          Where there is still room
        </h2>
        <p className="mt-5 max-w-[660px] text-xl leading-relaxed text-muted-foreground">
          Public asset registers and grid expansion plans, aggregated into a proxy headroom score
          for every federal state - before you talk to any operator.
        </p>

        <Label kind="proxy" note="illustrative" className="mt-7 self-start" />

        <Separator className="mt-8" />

        <div className="mt-8 max-w-[660px]">
          <span className="micro text-muted-foreground">Headroom score</span>
          <div
            className="mt-3 h-2 w-full rounded-sm border border-border"
            style={{ background: HEADROOM_RAMP }}
          />
          <div className="mt-2.5 flex justify-between text-sm text-muted-foreground">
            <span>0 - no headroom</span>
            <span>100 - most headroom</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-[660px]"
        >
          <Surface className="flex items-center gap-6 px-7 py-6">
            <span
              aria-hidden
              className="size-10 shrink-0 rounded-sm border border-border"
              style={{
                backgroundColor: 'var(--chart-2)',
                opacity: headroomOpacity(siteRegion?.headroomScore ?? 0),
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xl font-semibold tracking-[-0.01em] text-foreground">
                {site.name}
              </div>
              <div className="mt-1 text-base text-muted-foreground">
                {site.stateName} - {site.motorway} -{' '}
                <span className="tabular">{site.requestedMw}</span>
                <span className="font-mono text-sm"> MW</span> requested
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Counter
                value={siteRegion?.headroomScore ?? 0}
                duration={1}
                className="text-[40px] leading-none font-semibold tracking-[-0.02em] text-foreground"
              />
              <div className="mt-1.5 font-mono text-sm text-muted-foreground">of 100</div>
            </div>
          </Surface>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.6 }}
          className="mt-6 text-base font-medium text-foreground"
        >
          Click the pulsing pin to continue.
        </motion.p>

        <p className="mt-auto pt-8 text-[12px] text-muted-foreground">
          State outlines: deutschlandGeoJSON (The Unlicense), derived from DIVA-GIS country data.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <HeadroomMap data={data} onPinClick={onAdvance} height={MAP_HEIGHT} />
      </div>
    </div>
  )
}
