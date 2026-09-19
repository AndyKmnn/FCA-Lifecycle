import type { District, Districts, Limits, Profile } from '../../data'
import type { Curtailment } from './compute'
import { curtailmentFor } from './compute'

export interface DistrictOffer {
  district: District
  /** The cap regime this district writes, in words. */
  rule: string
  /** Computed from the uploaded profile against that regime. */
  result: Curtailment
  /** Months of queue this district skips versus waiting for firm capacity. */
  monthsSkipped: number
  recommended: boolean
}

const RULE_LABEL: Record<District['limitType'], (l: Limits) => string> = {
  static: (l) => `Static cap ${l.meta.staticCapMw.toFixed(1)} MW, all year`,
  dynamic: (l) =>
    `Seasonal time-of-day cap ${l.meta.timeOfDay.minMw.toFixed(1)}-${l.meta.timeOfDay.maxMw.toFixed(1)} MW`,
  fullyDynamic: (l) =>
    `Day-ahead limits ${l.meta.guaranteedMinimumMw.toFixed(1)}-${l.meta.defaultLimitMw.toFixed(1)} MW`,
}

/**
 * What each operator's district would cost this site.
 *
 * The limit type comes from districts.json; the money comes from running the
 * uploaded profile against that type with the same engine scene 2 always used,
 * so no figure here is written down anywhere - they are all computed.
 *
 * Recommended is not a stored flag either: it is whichever offer costs least,
 * settled by the shorter queue if two ever tie.
 */
export function buildDistrictOffers(
  profile: Profile,
  limits: Limits,
  districts: Districts,
): DistrictOffer[] {
  const offers = districts.districts.map((district) => ({
    district,
    rule: RULE_LABEL[district.limitType](limits),
    result: curtailmentFor(profile, limits, district.limitType),
    monthsSkipped: district.monthsToFirm - district.monthsToConnect,
    recommended: false,
  }))

  let best = offers[0]
  for (const o of offers) {
    if (
      o.result.costEur < best.result.costEur ||
      (o.result.costEur === best.result.costEur &&
        o.district.monthsToConnect < best.district.monthsToConnect)
    )
      best = o
  }
  best.recommended = true
  return offers
}
