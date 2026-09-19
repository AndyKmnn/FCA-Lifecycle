/** Shared formatting for scene 3. Fixed locale and UTC, so the demo never varies. */

const LOCALE = 'en-GB'

const LONG = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const MONTH = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' })

export const longDate = (iso: string) => LONG.format(new Date(`${iso}T00:00:00Z`))
export const shortMonth = (iso: string) => MONTH.format(new Date(`${iso}T00:00:00Z`))

export const mw = (v: number) => v.toFixed(2)
export const mwh = (v: number) => v.toFixed(1)
export const hhmm = (hour: number) => `${String(hour).padStart(2, '0')}:00`

/** 4,599,000 -> "4.60" (millions, two decimals). */
export const eurMillions = (v: number) => (v / 1e6).toFixed(2)
