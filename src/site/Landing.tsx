import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND, Button, Chip, Footer, Navbar } from '../design'

/**
 * Landing page. Owned by the site track.
 * All copy comes from docs/PRODUCT.md - see CLAUDE.md. No investor material.
 */
export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero. Ruled-paper grid behind it, fading out - the drawing board. */}
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="rule-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,#000_10%,transparent_70%)]"
          />
          <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-8 py-24">
            <Chip>Flexible Connection Agreements</Chip>

            <h1 className="mt-8 max-w-[24ch] text-[64px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-foreground">
              {BRAND.tagline}
            </h1>

            <p className="mt-7 max-w-[62ch] border-l-2 border-border pl-5 text-xl leading-relaxed text-muted-foreground">
              We get large loads connected years earlier, then run the flexibility that made it
              possible.
            </p>

            <div className="mt-12">
              <Link to="/demo">
                <Button size="2xl">
                  See the demo
                  <ArrowRight />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[1400px] px-8 pb-10">
            <p className="micro text-muted-foreground">
              Landing page placeholder - the site track builds this out from docs/PRODUCT.md.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
