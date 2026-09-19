import { Link } from 'react-router-dom'
import { BRAND, Button, Chip, Footer, Navbar, Surface } from '../design'

/**
 * Landing page placeholder. Owned by the site track.
 * All copy comes from docs/PRODUCT.md - see CLAUDE.md. No investor material.
 */
export function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[1560px] flex-1 px-8 py-16">
        <Surface className="px-14 py-16">
          <Chip tone="accent">Flexible Connection Agreements</Chip>
          <h1 className="mt-6 max-w-4xl text-6xl leading-[1.05] font-bold tracking-tight text-ink">
            {BRAND.tagline}
          </h1>
          <p className="mt-6 max-w-3xl text-2xl text-ink-muted">
            We get large loads connected years earlier, then run the flexibility that made it
            possible.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link to="/demo">
              <Button size="lg">See the demo</Button>
            </Link>
          </div>
        </Surface>

        <p className="mt-10 text-base text-ink-muted">
          Landing page placeholder - the site track builds this out from docs/PRODUCT.md.
        </p>
      </main>
      <Footer />
    </div>
  )
}
