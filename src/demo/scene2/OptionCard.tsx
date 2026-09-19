import { motion } from 'framer-motion'
import { Card, Chip, Counter, Label } from '../../design'
import type { FcaOption } from './compute'

export interface OptionCardProps {
  option: FcaOption
  show: boolean
  /** The recommended marker lands after all three cards are up. */
  showBadge: boolean
}

function Readout({
  label,
  value,
  unit,
  hint,
  decimals = 0,
  size = 'md',
}: {
  label: string
  value: number
  unit: string
  hint?: string
  decimals?: number
  size?: 'md' | 'lg'
}) {
  return (
    <div>
      <span className="micro text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-baseline gap-1.5">
        <Counter
          value={value}
          decimals={decimals}
          duration={1}
          className={`${
            size === 'lg' ? 'text-[34px]' : 'text-[26px]'
          } leading-none font-semibold tracking-[-0.02em] text-foreground`}
        />
        <span className="font-mono text-[13px] font-medium text-muted-foreground">{unit}</span>
      </div>
      {hint ? <div className="mt-1.5 text-[13px] text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function OptionCard({ option, show, showBadge }: OptionCardProps) {
  const { result } = option
  const recommended = option.recommended && showBadge

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1"
    >
      <Card
        className="h-full"
        highlight={recommended}
        title={option.title}
        subtitle={option.rule}
        badge={
          option.recommended ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={showBadge ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Chip selected>Recommended</Chip>
            </motion.div>
          ) : null
        }
        footer={<p className="text-[12px] leading-snug text-muted-foreground">{option.note}</p>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Readout label="Affected hours" value={Math.round(result.hours)} unit="h" hint="a year" />
          <Readout
            label="Energy at risk"
            value={Math.round(result.energyMwh)}
            unit="MWh"
            hint={`${result.sharePct.toFixed(1)} % of the year`}
          />
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <Readout
            label="Cost of the cap"
            value={Math.round(result.costEur / 1000) * 1000}
            unit="EUR"
            hint="about, before the battery"
            size="lg"
          />
          <Label kind="assumption" note="margin 250 EUR/MWh" className="mt-4" />
        </div>
      </Card>
    </motion.div>
  )
}
