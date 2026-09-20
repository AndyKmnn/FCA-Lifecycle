import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, Separator, Stepper, Wordmark } from '../design'
import Scene1 from '../demo/scene1/Scene1'
import Scene3 from '../demo/scene3/Scene3'
import { Stage } from './Stage'
import type { SceneProps } from './types'

const SCENES: Array<{ label: string; Component: (props: SceneProps) => React.ReactElement }> = [
  { label: 'Where to connect', Component: Scene1 },
  { label: 'Holding the cap', Component: Scene3 },
]

const STEP_LABELS = SCENES.map((s) => s.label)

/** A key cap, the way a manual prints one. */
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-border bg-card px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

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
      // Never take a key that belongs to something the presenter is typing in.
      // Without this, searching for "Regensburg" restarts the scene on the R,
      // a space in "Bad Toelz" advances it, and the arrow keys move the deck
      // instead of the caret. Cmd+R has to reach the browser as well.
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT')
      )
        return

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
    <div className="h-screen w-screen overflow-hidden bg-background">
      <Stage>
        <div className="absolute inset-0 flex flex-col px-14 py-10">
          <header className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-4">
              <Wordmark />
              <Separator orientation="vertical" className="h-6" />
              <Chip>Autohof Hallertau - Demo DSO</Chip>
            </div>
            <Stepper steps={STEP_LABELS} current={index} onSelect={setIndex} />
          </header>

          <Separator className="mt-6 shrink-0" />

          <main className="relative mt-8 min-h-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${run}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Current onAdvance={next} onRestart={restart} />
              </motion.div>
            </AnimatePresence>
          </main>

          <Separator className="mt-8 shrink-0" />

          <footer className="mt-5 flex shrink-0 items-center justify-between text-[13px] text-muted-foreground">
            <div className="flex items-center gap-5">
              <span className="tabular">
                Scene {index + 1} of {SCENES.length}
              </span>
              <span className="flex items-center gap-1.5">
                <Key>&rarr;</Key>
                <Key>space</Key>
                next
              </span>
              <span className="flex items-center gap-1.5">
                <Key>&larr;</Key>
                back
              </span>
              <span className="flex items-center gap-1.5">
                <Key>R</Key>
                restart
              </span>
            </div>
            <Link
              to="/"
              className="rounded-md font-medium transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Back to site
            </Link>
          </footer>
        </div>
      </Stage>
    </div>
  )
}
