import { NavLink } from 'react-router-dom'
import { Wordmark } from './Wordmark'
import { cn } from './utils'

const LINKS = [
  { to: '/', label: 'Product', end: true },
  { to: '/demo', label: 'Demo', end: false },
  { to: '/team', label: 'Team', end: false },
] as const

/** Sticky, hairline-ruled, glass. Nothing in it that is not a destination. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-8">
        <NavLink to="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Wordmark />
        </NavLink>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-foreground"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
