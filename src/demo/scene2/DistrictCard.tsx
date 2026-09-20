import { motion } from 'framer-motion'
import { Card, Chip, Counter } from '../../design'
import type { DistrictOffer } from './districtOffers'

export interface DistrictCardProps {
  offer: DistrictOffer
  show: boolean
  showBadge: boolean
  /** The district the presenter clicked in scene 1. */
  picked: boolean
}

function Readout({
  label,
  value,
  unit,
  hint,
}: {
  label: string
  value: number
  unit: string
  hint?: string
}) {
  return (
    <div>
      <span className="micro text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <Counter
          value={value}
          duration={1}
          className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-foreground"
        />
        <span className="font-mono text-[13px] font-medium text-muted-foreground">{unit}</span>
      </div>
      {hint ? <div className="mt-1 text-[13px] text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function DistrictCard({ offer, show, showBadge, picked }: DistrictCardProps) {
  const { district, result } = offer
  const highlight = (offer.recommended && showBadge) || picked

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1"
    >
      <Card
        className="h-full"
        highlight={highlight}
        title={district.name}
        subtitle={offer.rule}
        badge={
          offer.recommended ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={showBadge ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Chip selected>Recommended</Chip>
            </motion.div>
          ) : null
        }
        footer={
          <p className="text-[13px] leading-snug text-muted-foreground">{district.note}</p>
        }
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Readout
            label="Connects in"
            value={district.monthsToConnect}
            unit="months"
            hint={`${district.monthsToFirm} months for firm`}
          />
          <Readout
            label="Queue skipped"
            value={offer.monthsSkipped}
            unit="months"
            hint="versus waiting"
          />
          <Readout
            label="Hours affected"
            value={Math.round(result.hours)}
            unit="h"
            hint={`${Math.round(result.energyMwh)} MWh at risk`}
          />
          <Readout
            label="Cost of the cap"
            value={Math.round(result.costEur / 1000)}
            unit="k EUR"
            hint={`${result.sharePct.toFixed(1)} % of annual energy`}
          />
        </div>
      </Card>
    </motion.div>
  )
}
