import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export const STAGE_WIDTH = 1920
export const STAGE_HEIGHT = 1080

/**
 * A fixed 1920x1080 stage, scaled to fit whatever projector it lands on.
 * Everything inside can be laid out in real pixels and will look identical
 * on the presenter's laptop and on the beamer.
 */
export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () => {
      const el = ref.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-surface">
      <div
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="absolute top-1/2 left-1/2"
      >
        {children}
      </div>
    </div>
  )
}
