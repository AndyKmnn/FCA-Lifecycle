import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from './utils'

export interface CounterProps {
  value: number
  /** Decimal places shown while and after counting. */
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Animated number. Deterministic: same value in, same sequence out. */
export function Counter({
  value,
  decimals = 0,
  duration = 1.2,
  prefix = '',
  suffix = '',
  className,
}: CounterProps) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(v),
    })
    return () => controls.stop()
  }, [value, duration])

  const text = shown.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={cn('tabular', className)} data-slot="stat-value">
      {prefix}
      {text}
      {suffix}
    </span>
  )
}
