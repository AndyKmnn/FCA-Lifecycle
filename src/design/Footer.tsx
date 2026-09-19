import { BRAND } from './brand'

export function Footer() {
  return (
    <footer className="w-full px-8 pb-8">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-3 border-t border-dark-shadow/70 pt-6">
        <span className="text-sm font-semibold text-ink">{BRAND.name}</span>
        <span className="text-sm text-ink-muted">{BRAND.demoNotice}</span>
      </div>
    </footer>
  )
}
