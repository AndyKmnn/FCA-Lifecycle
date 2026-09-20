import { animate, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Profile } from '../../data'
import { Button, Counter, Progress, Separator, Surface } from '../../design'
import { LoadCurve } from './LoadCurve'

export interface UploadStripProps {
  profile: Profile
  /** Upload animation runs first; the profile facts land when it finishes. */
  uploaded: boolean
  durationSec: number
  /** The file the presenter chose, or null while the scene is still waiting. */
  fileName: string | null
  onPick: (name: string) => void
}

/** What the sample is called when the presenter has no file to hand. */
const SAMPLE = 'autohof-hallertau-2026.xlsx'

/** A readout: caption, figure, unit in mono beside it. */
function Fact({
  label,
  value,
  unit,
  decimals = 0,
}: {
  label: string
  value: number
  unit: string
  decimals?: number
}) {
  return (
    <div className="px-6">
      <span className="micro text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-baseline gap-1.5">
        <Counter
          value={value}
          decimals={decimals}
          duration={1}
          className="text-[28px] leading-none font-semibold tracking-[-0.02em] text-foreground"
        />
        <span className="font-mono text-[13px] font-medium text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

/**
 * The site's load profile arrives.
 *
 * The file picker is real - any file can be dropped on it or chosen from disk,
 * and its name is shown. What it contains is not read. The profile behind every
 * figure on screen is always the same seeded synthetic year from
 * public/data/profile.json, which is what keeps the demo identical at every
 * pitch.
 *
 * That is a deliberate prop, not an unfinished feature: this scene is there to
 * show what happens *after* a profile is in, and a real parser would put the
 * room's attention on the parser.
 */
export function UploadStrip({
  profile,
  uploaded,
  durationSec,
  fileName,
  onPick,
}: UploadStripProps) {
  const [pct, setPct] = useState(0)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // The bar runs when a file lands, not when the scene mounts.
  useEffect(() => {
    if (!fileName) return
    const controls = animate(0, 100, {
      duration: durationSec,
      ease: 'easeInOut',
      onUpdate: setPct,
    })
    return () => controls.stop()
  }, [fileName, durationSec])

  const meta = profile.meta

  if (!fileName) {
    return (
      <Surface
        className={`flex items-center gap-6 py-5 pr-6 pl-7 ${over ? 'border-primary' : ''}`}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault()
          setOver(false)
          const dropped = e.dataTransfer.files?.[0]
          onPick(dropped ? dropped.name : SAMPLE)
        }}
      >
        <div className="flex flex-1 items-center gap-5">
          <div className="flex h-14 flex-1 items-center rounded-lg border border-dashed border-border px-5 text-[15px] text-muted-foreground">
            Drop the site&rsquo;s 15-minute load profile here
          </div>
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose a file
          </Button>
          <button
            type="button"
            onClick={() => onPick(SAMPLE)}
            className="text-[13px] font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            or use the sample
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const chosen = e.target.files?.[0]
              if (chosen) onPick(chosen.name)
            }}
          />
        </div>
      </Surface>
    )
  }

  return (
    <Surface className="flex items-center gap-2 py-5 pr-6 pl-7">
      <div className="w-[380px] shrink-0">
        <div className="flex items-baseline justify-between gap-4">
          <span className="truncate font-mono text-[15px] font-medium text-foreground">
            {fileName}
          </span>
          <span className="micro shrink-0 text-muted-foreground">
            {uploaded ? 'Read' : 'Reading'}
          </span>
        </div>
        <Progress value={pct} className="mt-3" />
        <div className="mt-2.5 text-[13px] text-muted-foreground">
          <span className="tabular">{meta.count.toLocaleString('en-GB')}</span> intervals -{' '}
          {meta.intervalMinutes}-minute resolution - <span className="tabular">{meta.year}</span>
        </div>
      </div>

      <Separator orientation="vertical" className="mx-4 h-14" />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={uploaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 items-center divide-x divide-border"
      >
        <Fact label="Peak" value={meta.peakMw} unit="MW" decimals={2} />
        <Fact label="Average" value={meta.meanMw} unit="MW" decimals={2} />
        <Fact label="A year" value={meta.annualGwh} unit="GWh" decimals={1} />
        <Fact label="Battery" value={meta.batteryPowerMw} unit={`MW / ${meta.batteryEnergyMwh} MWh`} />

        <div className="pl-6">
          <span className="micro text-muted-foreground">Load duration curve</span>
          <LoadCurve values={profile.values} className="mt-2 h-[42px] w-[210px]" />
        </div>
      </motion.div>
    </Surface>
  )
}
