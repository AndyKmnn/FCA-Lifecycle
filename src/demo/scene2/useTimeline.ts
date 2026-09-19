import { useEffect, useState } from 'react'

/**
 * Scenes that have already played their build once this run.
 *
 * The shell remounts a scene every time the presenter moves to it, so walking
 * back with the left arrow would otherwise replay a 7-second build from a blank
 * stage mid-pitch. A scene that has played once comes straight back up
 * finished. `R` clears this, so a restart replays properly from the top.
 */
const played = new Set<string>()

/** True once this scene has played its build to the end in this run. */
export const hasPlayed = (key: string) => played.has(key)

/** Called by scene 1 on mount, which is where restart lands. */
export function resetTimelines() {
  played.clear()
}

/**
 * Deterministic scripted timing: the same marks fire in the same order on every
 * run, so the scene plays identically at every pitch.
 *
 * Pass `key` to opt into the replay-instantly-on-return behaviour above.
 */
export function useTimeline(marks: readonly number[], key?: string): number {
  const [stage, setStage] = useState(() => (key && played.has(key) ? marks.length : 0))

  useEffect(() => {
    if (key && played.has(key)) return
    const timers = marks.map((at, i) => window.setTimeout(() => setStage(i + 1), at))
    if (key) {
      timers.push(
        window.setTimeout(() => played.add(key), marks[marks.length - 1] ?? 0),
      )
    }
    return () => timers.forEach(window.clearTimeout)
  }, [marks, key])

  return stage
}

/**
 * Types `text` out one character at a time once `start` is true.
 *
 * With `instant`, it is simply already finished - the presenter walking back
 * into a scene should find the term sheet as they left it, not watch it typed
 * out again.
 */
export function useTypewriter(text: string, start: boolean, msPerChar: number, instant = false) {
  const [count, setCount] = useState(instant ? text.length : 0)

  useEffect(() => {
    if (!start || instant) return
    let typed = 0
    const id = window.setInterval(() => {
      typed += 1
      setCount(typed)
      if (typed >= text.length) window.clearInterval(id)
    }, msPerChar)
    return () => window.clearInterval(id)
  }, [text, start, msPerChar, instant])

  return { shown: text.slice(0, count), done: start && count >= text.length }
}
