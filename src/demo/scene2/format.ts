const EN = 'en-GB'

export const hours = (h: number) => `${Math.round(h).toLocaleString(EN)} h`
export const energy = (mwh: number) => `${Math.round(mwh).toLocaleString(EN)} MWh`
export const share = (pct: number) => `${pct.toFixed(1)} %`

/** Rounded to the nearest thousand - the margin behind it is an assumption. */
export const euros = (eur: number) =>
  `about EUR ${(Math.round(eur / 1000) * 1000).toLocaleString(EN)}`
