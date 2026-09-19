import { useEffect, useState } from 'react'

/**
 * Deterministic scripted timing: the same marks fire in the same order on every
 * run, so the scene plays identically at every pitch.
 */
export function useTimeline(marks: readonly number[]): number {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timers = marks.map((at, i) => window.setTimeout(() => setStage(i + 1), at))
    return () => timers.forEach(window.clearTimeout)
  }, [marks])

  return stage
}

/** Types `text` out one character at a time once `start` is true. */
export function useTypewriter(text: string, start: boolean, msPerChar: number) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    let typed = 0
    const id = window.setInterval(() => {
      typed += 1
      setCount(typed)
      if (typed >= text.length) window.clearInterval(id)
    }, msPerChar)
    return () => window.clearInterval(id)
  }, [text, start, msPerChar])

  return { shown: text.slice(0, count), done: start && count >= text.length }
}
