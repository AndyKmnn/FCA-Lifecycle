import type { Limits, Profile } from '../../data'
import type { FcaOption } from './compute'
import { energy, euros, hours, share } from './format'

const COL = 20

const row = (label: string, value: string) => `${label.padEnd(COL)}${value}`

/** Every line comes from the loaded data or from the option just computed. */
export function termSheetText(profile: Profile, limits: Limits, option: FcaOption): string {
  const p = profile.meta
  const l = limits.meta
  const r = option.result
  return [
    'DRAFT TERM SHEET - FLEXIBLE CONNECTION AGREEMENT',
    '',
    row('Site', p.site),
    row('Operator', l.operator),
    row('Connection', `${p.connectionMw} MW`),
    row('Limit type', `${option.title} - ${option.rule}`),
    row('Notice period', l.noticePeriod),
    row('Guaranteed minimum', `${l.guaranteedMinimumMw} MW`),
    row('Compliance asset', `on-site battery ${p.batteryPowerMw} MW / ${p.batteryEnergyMwh} MWh`),
    row('Conversion', `to firm ${p.connectionMw} MW on grid reinforcement`),
    row(
      'Cost of the cap',
      `${hours(r.hours)}, ${energy(r.energyMwh)} (${share(r.sharePct)}) - ${euros(r.costEur)} a year`,
    ),
  ].join('\n')
}
