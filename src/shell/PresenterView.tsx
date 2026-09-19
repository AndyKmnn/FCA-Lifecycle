import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, Chip, Stepper } from '../design'
import Scene1 from '../demo/scene1/Scene1'
import Scene2 from '../demo/scene2/Scene2'
import Scene3 from '../demo/scene3/Scene3'
import { Stage } from './Stage'
import type { SceneProps } from './types'

const SCENES: Array<{ label: string; Component: (props: SceneProps) => React.ReactElement }> = [
  { label: 'Headroom map', Component: Scene1 },
  { label: 'Upload and term sheet', Component: Scene2 },
  { label: 'Autopilot replay', Component: Scene3 },
]

const STEP_LABELS = SCENES.map((s) => s.label)

export function PresenterView() {
  const [index, setIndex] = useState(0)
  /** Bumped on restart so scenes remount and replay from the top. */
  const [run, setRun] = useState(0)

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, SCENES.length - 1)), [])
  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const restart = useCallback(() => {
    setIndex(0)
    setRun((r) => r + 1)
  }, [])

  useEffect(() => {
    document.body.classList.add('presenter-lock')
    return () => document.body.classList.remove('presenter-lock')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        back()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        restart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, restart])

  const Current = SCENES[index].Component

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface">
      <Stage>
        <div className="absolute inset-0 flex flex-col px-16 py-12">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold tracking-tight text-ink">{BRAND.name}</span>
              <Chip>Autohof Hallertau - Demo DSO</Chip>
            </div>
            <Stepper steps={STEP_LABELS} current={index} onSelect={setIndex} />
          </header>

          <main className="relative mt-10 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${run}-${index}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <Current onAdvance={next} onRestart={restart} />
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="mt-8 flex items-center justify-between text-sm text-ink-muted">
            <span>
              Scene {index + 1} of {SCENES.length} - right arrow or space: next, left arrow: back,
              R: restart
            </span>
            <Link to="/" className="font-semibold text-ink-muted hover:text-ink">
              Back to site
            </Link>
          </footer>
        </div>
      </Stage>
    </div>
  )
}
