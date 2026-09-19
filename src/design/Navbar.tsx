import { NavLink } from 'react-router-dom'
import { BRAND } from './brand'
import { cn } from './cn'
import { Surface } from './Surface'

const LINKS = [
  { to: '/', label: 'Product', end: true },
  { to: '/demo', label: 'Demo', end: false },
] as const

export function Navbar() {
  return (
    <header className="w-full px-8 pt-6">
      <Surface className="mx-auto flex max-w-[1560px] items-center justify-between px-7 py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-ink">
            <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
              <path d="M18.5 4 9 18h6l-1.5 10L23 14h-6l1.5-10z" fill="#F5A623" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">{BRAND.name}</span>
        </NavLink>
        <nav className="flex items-center gap-2">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'rounded-[14px] px-4 py-2 text-[15px] font-semibold transition-all duration-150',
                  isActive ? 'nm-pressed text-ink' : 'text-ink-muted hover:text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </Surface>
    </header>
  )
}
