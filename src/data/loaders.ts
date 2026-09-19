import type { Districts, Limits, Profile, Regions } from './types'

/**
 * Loads the seeded demo data from public/data.
 * Same-origin static files only - the demo makes no network calls.
 * Each file is fetched once and cached for the life of the page.
 */
const cache = new Map<string, Promise<unknown>>()

function load<T>(file: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${file}`
  let pending = cache.get(url) as Promise<T> | undefined
  if (!pending) {
    pending = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${url}: ${res.status}`)
      return res.json() as Promise<T>
    })
    cache.set(url, pending)
  }
  return pending
}

export const loadProfile = () => load<Profile>('profile.json')
export const loadLimits = () => load<Limits>('limits.json')
export const loadRegions = () => load<Regions>('regions.json')
export const loadDistricts = () => load<Districts>('districts.json')

export const STEPS_PER_DAY = 96
export const HOURS_PER_STEP = 0.25

/** The 96 quarter-hour values of one day, 0-indexed from 1 January. */
export function sliceDay(profile: Profile, dayOfYear: number): number[] {
  const from = dayOfYear * STEPS_PER_DAY
  return profile.values.slice(from, from + STEPS_PER_DAY)
}

/** 0-based day of the year for a YYYY-MM-DD date in the profile's year. */
export function dayIndex(date: string, year: number): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.UTC(year, 0, 1)) / 86_400_000)
}

/** The 96 quarter-hour day-ahead limits for one day, in MW. */
export function limitSeriesForDay(limits: Limits, dayOfYear: number): number[] {
  const day = limits.days[dayOfYear]
  const series = new Array<number>(STEPS_PER_DAY).fill(limits.meta.defaultLimitMw)
  if (!day) return series
  for (const win of day.windows)
    for (let s = win.startHour * 4; s < win.endHour * 4; s++) series[s] = win.limitMw
  return series
}
