import { useCallback, useState } from 'react'
import { DAYS_PER_YEAR } from './replan'

/**
 * Which day of the year is on screen.
 *
 * This replaced a requestAnimationFrame replay clock. Scene 3 used to play the
 * year by itself in about 90 seconds; in front of an audience that turned out to
 * be unreadable - nobody could see what had changed, or why. The presenter now
 * picks the day, so the only state left is which one.
 */

export interface DaySelection {
  day: number
  setDay: (day: number) => void
  nextDay: () => void
  prevDay: () => void
}

const clamp = (day: number) => Math.max(0, Math.min(DAYS_PER_YEAR - 1, Math.round(day)))

export function useDaySelection(initial = 0): DaySelection {
  const [day, setDayState] = useState(() => clamp(initial))

  const setDay = useCallback((next: number) => setDayState(clamp(next)), [])
  const nextDay = useCallback(() => setDayState((d) => clamp(d + 1)), [])
  const prevDay = useCallback(() => setDayState((d) => clamp(d - 1)), [])

  return { day, setDay, nextDay, prevDay }
}
