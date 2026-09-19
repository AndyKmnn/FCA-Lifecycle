import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useTypewriter } from './useTimeline'

export interface TermSheetProps {
  text: string
  start: boolean
  msPerChar: number
  /** Skip the typing and show the finished sheet - used when returning. */
  instant?: boolean
  onDone?: () => void
}

export function TermSheet({ text, start, msPerChar, instant = false, onDone }: TermSheetProps) {
  const { shown, done } = useTypewriter(text, start, msPerChar, instant)

  useEffect(() => {
    if (done) onDone?.()
  }, [done, onDone])

  return (
    <pre className="font-mono text-[15px] leading-[1.5] whitespace-pre text-foreground">
      {shown}
      {start && !done ? (
        <motion.span
          aria-hidden
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.45, 0.5, 1] }}
          className="ml-0.5 inline-block h-[15px] w-[8px] translate-y-[2px] bg-primary"
        />
      ) : null}
    </pre>
  )
}
