import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { Limits, Profile } from '../../data'
import { loadLimits, loadProfile } from '../../data'
import { Button, Label, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'
import { LoadDurationChart } from './LoadDurationChart'
import { OptionCard } from './OptionCard'
import { TermSheet } from './TermSheet'
import { UploadStrip } from './UploadStrip'
import { buildOptions, loadDurationCurve } from './compute'
import { termSheetText } from './termSheetText'
import { useTimeline } from './useTimeline'

const UPLOAD_SEC = 3.6

/** Scripted beats, ms from the scene's start. About 60 s end to end. */
const MARKS = [
  4200, // 1 upload finished, profile facts land
  6200, // 2 load-duration curve draws
  15000, // 3 static option
  18500, // 4 dynamic option
  22000, // 5 fully dynamic option
  25000, // 6 recommended marker
  27500, // 7 term sheet starts typing
] as const

const TYPING_MS_PER_CHAR = 32

/**
 * Scene 2 - Upload and term sheet (60 s). Owned by the demo12 track.
 * The profile "uploads", then everything on screen is computed in the browser
 * from public/data: the load-duration curve, the three FCA options, and the
 * draft term sheet that types itself in.
 */
export default function Scene2({ onAdvance }: SceneProps) {
  const [data, setData] = useState<{ profile: Profile; limits: Limits } | null>(null)
  const [typed, setTyped] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([loadProfile(), loadLimits()]).then(([profile, limits]) => {
      if (live) setData({ profile, limits })
    })
    return () => {
      live = false
    }
  }, [])

  const stage = useTimeline(MARKS)

  const computed = useMemo(() => {
    if (!data) return null
    const options = buildOptions(data.profile, data.limits)
    const best = options.find((o) => o.recommended) ?? options[options.length - 1]
    return {
      options,
      curve: loadDurationCurve(data.profile),
      sheet: termSheetText(data.profile, data.limits, best),
    }
  }, [data])

  if (!data || !computed) return <div className="h-full w-full" />

  const { profile, limits } = data

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <UploadStrip meta={profile.meta} uploaded={stage >= 1} durationSec={UPLOAD_SEC} />

      <div className="flex min-h-0 flex-1 gap-5">
        <Surface className="flex w-[660px] shrink-0 flex-col px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg leading-tight font-semibold tracking-[-0.01em] text-foreground">
                Load-duration curve
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                The year's{' '}
                <span className="tabular">{profile.meta.count.toLocaleString('en-GB')}</span>{' '}
                quarter-hours, sorted from the highest load down.
              </p>
            </div>
            <Label kind="simulation" className="shrink-0" />
          </div>
          <div className="mt-4 min-h-0 flex-1">
            <LoadDurationChart
              data={computed.curve}
              connectionMw={profile.meta.connectionMw}
              staticCapMw={limits.meta.staticCapMw}
              play={stage >= 2}
            />
          </div>
        </Surface>

        <div className="flex min-w-0 flex-1 gap-5">
          {computed.options.map((option, i) => (
            <OptionCard
              key={option.id}
              option={option}
              show={stage >= 3 + i}
              showBadge={stage >= 6}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={stage >= 7 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0"
      >
        <Surface variant="inset" className="flex items-center gap-8 px-8 py-5">
          <div className="min-w-0 flex-1">
            <TermSheet
              text={computed.sheet}
              start={stage >= 7}
              msPerChar={TYPING_MS_PER_CHAR}
              onDone={() => setTyped(true)}
            />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: typed ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="shrink-0"
          >
            <Button size="xl" onClick={onAdvance} disabled={!typed}>
              See it operate
            </Button>
          </motion.div>
        </Surface>
      </motion.div>
    </div>
  )
}
