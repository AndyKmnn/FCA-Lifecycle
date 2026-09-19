/** Shapes of the files in public/data, produced by scripts/generate-data.mjs. */

export interface ProfileMeta {
  site: string
  description: string
  label: 'Simulation'
  year: number
  /** ISO timestamp of the first interval, UTC. */
  start: string
  intervalMinutes: number
  count: number
  unit: 'MW'
  connectionMw: number
  batteryPowerMw: number
  batteryEnergyMwh: number
  peakMw: number
  meanMw: number
  annualMwh: number
  annualGwh: number
  marginEurPerMwh: number
}

export interface Profile {
  meta: ProfileMeta
  /** 35,040 quarter-hour values in MW, 1 January 00:00 UTC onwards. */
  values: number[]
}

export interface LimitWindow {
  startHour: number
  /** Exclusive. */
  endHour: number
  limitMw: number
}

export interface LimitDay {
  /** YYYY-MM-DD */
  date: string
  windows: LimitWindow[]
  reason: string
}

export interface TimeOfDayTable {
  description: string
  /** Index order of the rows in `table`. */
  seasons: string[]
  minMw: number
  maxMw: number
  /** [season][hourOfDay] cap in MW. */
  table: number[][]
}

export interface LimitsMeta {
  operator: string
  label: 'Simulation'
  year: number
  defaultLimitMw: number
  guaranteedMinimumMw: number
  noticePeriod: string
  constrainedDays: number
  scriptedDays: string[]
  timeOfDay: TimeOfDayTable
  staticCapMw: number
}

export interface Limits {
  meta: LimitsMeta
  /** One entry per day of the year, in order. */
  days: LimitDay[]
}

export interface Region {
  code: string
  name: string
  /** 0-100 proxy headroom score. Not measured capacity. */
  headroomScore: number
  lon: number
  lat: number
}

export interface Regions {
  meta: { label: 'Proxy estimate'; note: string; scale: string; year: number }
  site: {
    name: string
    state: string
    stateName: string
    motorway: string
    lon: number
    lat: number
    requestedMw: number
  }
  regions: Region[]
}
