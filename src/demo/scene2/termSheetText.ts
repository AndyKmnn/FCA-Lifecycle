import type { Limits, Profile } from '../../data'
import type { DistrictOffer } from './districtOffers'
import { energy, euros, hours, share } from './format'

const COL = 20

const row = (label: string, value: string) => `${label.padEnd(COL)}${value}`

/** Every line comes from the loaded data or from the offer just computed. */
export function termSheetText(profile: Profile, limits: Limits, offer: DistrictOffer): string {
  const p = profile.meta
  const l = limits.meta
  const r = offer.result
  const d = offer.district
  return [
    'DRAFT TERM SHEET - FLEXIBLE CONNECTION AGREEMENT',
    '',
    row('Site', p.site),
    row('Operator', d.name),
    row('Connection', `${p.connectionMw} MW`),
    row('Limit type', offer.rule),
    row('Notice period', d.limitType === 'fullyDynamic' ? l.noticePeriod : 'agreed up front'),
    row('Energised in', `${d.monthsToConnect} months, not ${d.monthsToFirm}`),
    row('Guaranteed minimum', `${l.guaranteedMinimumMw} MW`),
    row('Compliance asset', `on-site battery ${p.batteryPowerMw} MW / ${p.batteryEnergyMwh} MWh`),
    row('Conversion', `to firm ${p.connectionMw} MW on grid reinforcement`),
    row(
      'Cost of the cap',
      `${hours(r.hours)}, ${energy(r.energyMwh)} (${share(r.sharePct)}) - ${euros(r.costEur)} a year`,
    ),
  ].join('\n')
}
