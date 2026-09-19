import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Districts, Limits, Profile } from '../../data'
import { loadDistricts, loadLimits, loadProfile } from '../../data'
import { Button, Label, Separator, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'
import { getSelectedDistrict } from '../scene1/selection'
import { DistrictCard } from './DistrictCard'
import { TermSheet } from './TermSheet'
import { buildDistrictOffers } from './districtOffers'
import { termSheetText } from './termSheetText'
import { hasPlayed, useTimeline } from './useTimeline'

/** Scripted beats, ms from the scene's start. */
const MARKS = [
  900, // 1 first card
  1800, // 2 second
  2700, // 3 third
  3600, // 4 fourth
  5200, // 5 recommended marker
  7000, // 6 the term sheet starts typing
] as const

const TYPING_MS_PER_CHAR = 26

/**
 * The term sheet's finished height, reserved from the very first character.
 *
 * The panel used to grow from one line to twelve as it typed, which squeezed
 * the row above it and clipped the cards' footers out of view for the back half
 * of the scene. This has to be at least the finished height or the reflow comes
 * back: 12 lines at 15px / 1.5 = 270px, plus 40px of padding.
 */
const SHEET_MIN_HEIGHT = 312

/**
 * Scene 2 - On what terms. Owned by the demo12 track.
 *
 * The four operators' offers, compared on the axes that decide it: when they
 * connect you, what limit type they write, and what that cap costs against the
 * profile uploaded in scene 1. Every figure is computed here in the browser.
 * The presenter's pick from scene 1 is carried over and drafted into a term
 * sheet; with no pick, the cheapest offer is drafted instead.
 */
export default function Scene2({ onAdvance }: SceneProps) {
  const [data, setData] = useState<{
    profile: Profile
    limits: Limits
    districts: Districts
  } | null>(null)
  const [typed, setTyped] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([loadProfile(), loadLimits(), loadDistricts()]).then(
      ([profile, limits, districts]) => {
        if (live) setData({ profile, limits, districts })
      },
    )
    return () => {
      live = false
    }
  }, [])

  const stage = useTimeline(MARKS, 'scene2')

  /** Read once, before this run marks the scene as played. */
  const [instant] = useState(() => hasPlayed('scene2'))
  const markTyped = useCallback(() => setTyped(true), [])

  const computed = useMemo(() => {
    if (!data) return null
    const offers = buildDistrictOffers(data.profile, data.limits, data.districts)
    const pickedId = getSelectedDistrict()
    const chosen =
      offers.find((o) => o.district.id === pickedId) ??
      offers.find((o) => o.recommended) ??
      offers[0]
    return { offers, chosen, sheet: termSheetText(data.profile, data.limits, chosen) }
  }, [data])

  if (!data || !computed) return <div className="h-full w-full" />

  const pickedId = getSelectedDistrict()

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex shrink-0 items-end justify-between gap-6">
        <div>
          <span className="micro text-muted-foreground">FCA structuring and benchmark</span>
          <h2 className="mt-2 text-[30px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
            On what terms?
          </h2>
        </div>
        <p className="max-w-[720px] pb-1 text-right text-base text-muted-foreground">
          The same profile, run against each operator's limit regime. Hours, energy and euros are
          computed here in the browser - not quoted.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-5">
        {computed.offers.map((offer, i) => (
          <DistrictCard
            key={offer.district.id}
            offer={offer}
            show={stage >= 1 + i}
            showBadge={stage >= 5}
            picked={offer.district.id === pickedId}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={stage >= 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0"
        style={{ minHeight: SHEET_MIN_HEIGHT }}
      >
        <Surface
          variant="inset"
          className="flex items-start gap-8 px-8 py-5"
          style={{ minHeight: SHEET_MIN_HEIGHT }}
        >
          <div className="min-w-0 flex-1">
            <TermSheet
              text={computed.sheet}
              start={stage >= 6}
              msPerChar={TYPING_MS_PER_CHAR}
              instant={instant}
              onDone={markTyped}
            />
          </div>

          <div className="flex w-[260px] shrink-0 flex-col items-end gap-4 self-stretch">
            <Label kind="simulation" />
            <Label kind="assumption" note="margin 250 EUR/MWh" />
            <Separator className="my-1" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: typed ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              className="mt-auto"
            >
              <Button size="xl" onClick={onAdvance} disabled={!typed}>
                See it operate
              </Button>
            </motion.div>
          </div>
        </Surface>
      </motion.div>
    </div>
  )
}
