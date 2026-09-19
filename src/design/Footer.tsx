import { BRAND } from './brand'
import { Wordmark } from './Wordmark'

export function Footer() {
  return (
    <footer className="w-full border-t border-border">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-4 px-8 py-8">
        <Wordmark />
        <span className="text-sm text-muted-foreground">{BRAND.demoNotice}</span>
      </div>
    </footer>
  )
}
