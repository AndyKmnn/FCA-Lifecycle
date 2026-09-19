import { animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ProfileMeta } from '../../data'
import { Counter, Label, Progress, Separator, Surface } from '../../design'

export interface UploadStripProps {
  meta: ProfileMeta
  /** Upload animation runs first; the profile facts land when it finishes. */
  uploaded: boolean
  durationSec: number
}

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
 * The profile "uploads" - the file is already on disk, the progress is
 * scripted. Everything after it is computed from the real values.
 */
export function UploadStrip({ meta, uploaded, durationSec }: UploadStripProps) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const controls = animate(0, 100, {
      duration: durationSec,
      ease: 'easeInOut',
      onUpdate: setPct,
    })
    return () => controls.stop()
  }, [durationSec])

  return (
    <Surface className="flex items-center gap-2 py-5 pr-6 pl-7">
      <div className="w-[380px] shrink-0">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-[15px] font-medium text-foreground">profile.json</span>
          <span className="micro text-muted-foreground">
            {uploaded ? 'Uploaded' : 'Uploading'}
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
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 items-center divide-x divide-border"
      >
        <Fact label="Peak" value={meta.peakMw} unit="MW" decimals={2} />
        <Fact label="Average" value={meta.meanMw} unit="MW" decimals={2} />
        <Fact label="A year" value={meta.annualGwh} unit="GWh" decimals={1} />
        <Fact label="Battery" value={meta.batteryPowerMw} unit={`MW / ${meta.batteryEnergyMwh} MWh`} />
      </motion.div>

      <Label kind="simulation" className="shrink-0" />
    </Surface>
  )
}
