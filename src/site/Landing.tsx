import { ArrowRight } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, Button, Card, Chip, Footer, Navbar, Section, Surface } from '@/design'
import { GridMotif } from './GridMotif'
import {
  AutopilotSnippet,
  CapCostSnippet,
  IllustrationTag,
  NodeRankSnippet,
} from './Illustrations'
import { Reveal, RevealGroup, RevealItem } from './Reveal'

/**
 * The product website at /. Owned by the site track.
 * All copy is docs/PRODUCT.md rewritten in "you" form - see CLAUDE.md. No investor
 * material, and no figure that is not in PRODUCT.md.
 *
 * Styling follows docs/DESIGN_HANDOFF.md: components from @/design, no hard-coded
 * colour, hairlines instead of shadows, and brand amber reserved for the one thing
 * that matters on each screen - the call to action.
 */

const AUDIENCE = ['Charging parks', 'Battery storage', 'Electrolysers', 'Data centres']

const PROBLEM = [
  {
    head: 'The queue is measured in years.',
    body: 'Your site is chosen, your load profile is known and your capital is committed. The grid operator gives you a date years out.',
  },
  {
    head: 'Firm capacity waits for reinforcement.',
    body: 'A firm connection at your full requested power arrives only once the network around you has been rebuilt. Until then there is nothing to operate.',
  },
  {
    head: 'Nothing moves without a complete application.',
    body: 'Grid operators act on complete, pre-qualified applications. Assembling one - terms, templates, fees and timelines, for every operator you might approach - is a project of its own.',
  },
]

const LIMITATION_TYPES = [
  { name: 'Static', body: 'A fixed cap.' },
  { name: 'Dynamic', body: 'A cap that varies by season and time of day.' },
  { name: 'Fully dynamic', body: 'Limits sent by the operator day-ahead.' },
]

const PHASES = [
  {
    name: 'Intelligence',
    get: 'You know where to connect and on what terms, before you talk to any operator.',
  },
  {
    name: 'Transaction',
    get: 'You get a signed FCA, faster and on better terms.',
  },
  {
    name: 'Operations',
    get: 'Your cap is never breached, at minimum production or revenue loss, with evidence that stands up in a dispute.',
  },
  {
    name: 'Settlement',
    get: 'You get financial certainty: a capped connection becomes bankable.',
  },
]

const FEATURES = [
  {
    title: 'Know where to connect',
    body: 'Public asset registers and grid expansion plans are aggregated and scored for headroom per substation, so you get a ranked list of candidate nodes - each with the curtailment profile you should expect there.',
    snippet: <NodeRankSnippet />,
  },
  {
    title: 'Know what the cap costs you before signing',
    body: 'Your 15-minute load profile is run against each FCA type as a load-duration curve, a percentile analysis and a curtailment simulation. You see which cap you can live with, what it costs and whether the offer in front of you is good.',
    snippet: <CapCostSnippet />,
  },
  {
    title: 'Never breach the cap',
    body: "The operator's limits, your live site load and your asset states become a schedule that stays under the cap - battery first, flexible loads second - with alarms and an audit-grade event log behind it.",
    snippet: <AutopilotSnippet />,
  },
]

/** The visible hand-over between two phases: this phase's output is the next one's input. */
function HandOver() {
  return (
    <div aria-hidden className="flex w-20 flex-col items-center justify-center gap-2">
      <svg viewBox="0 0 64 12" className="w-16" role="presentation">
        <line x1={1} y1={6} x2={52} y2={6} stroke="var(--chart-axis)" strokeWidth={1} />
        <path d="M51 2 59 6 51 10Z" fill="var(--chart-axis)" />
      </svg>
      <span className="micro text-muted-foreground">feeds</span>
    </div>
  )
}

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* 1 - Hero. Ruled-paper grid behind it, fading out - the drawing board. */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="rule-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,#000_10%,transparent_70%)]"
          />
          <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-16 px-8 py-24">
            <Reveal>
              <Chip>Flexible Connection Agreements</Chip>

              <h1 className="mt-8 max-w-[24ch] text-[64px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-foreground">
                {BRAND.tagline}
              </h1>

              <p className="mt-7 max-w-[62ch] border-l-2 border-border pl-5 text-xl leading-relaxed text-muted-foreground">
                You get connected years earlier - and we run the flexibility that made it
                possible.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-2">
                {AUDIENCE.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>

              <div className="mt-12 flex items-center gap-8">
                <Link to="/demo">
                  <Button size="2xl">
                    Watch the demo
                    <ArrowRight />
                  </Button>
                </Link>
                <a
                  href="#how-it-works"
                  className="text-base font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  See how it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <GridMotif className="w-full" />
            </Reveal>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1400px] px-8">
          {/* 2 - The problem */}
          <RevealGroup className="py-24">
            <RevealItem>
              <Section
                eyebrow="01 / Where you are today"
                title="You have spent years waiting for a grid connection."
              />
            </RevealItem>
            <div className="grid grid-cols-3 gap-6">
              {PROBLEM.map((item) => (
                <RevealItem key={item.head} className="h-full">
                  <Surface className="h-full px-7 py-7">
                    <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] text-foreground">
                      {item.head}
                    </h3>
                    <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </Surface>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>

          {/* 3 - What a flexible connection is */}
          <RevealGroup className="border-t border-border py-24">
            <RevealItem>
              <Section
                eyebrow="02 / Speed for firmness"
                title="A Flexible Connection Agreement trades firmness for speed."
              >
                <p className="max-w-[70ch] text-xl leading-relaxed text-muted-foreground">
                  The grid operator connects you now; in return you accept a power limit at
                  certain times.
                </p>
              </Section>
            </RevealItem>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {LIMITATION_TYPES.map((type) => (
                <RevealItem key={type.name} className="h-full">
                  <Surface className="h-full px-7 py-7">
                    <Chip>{type.name}</Chip>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                      {type.body}
                    </p>
                  </Surface>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>

          {/* 4 - How it works */}
          <RevealGroup id="how-it-works" className="scroll-mt-8 border-t border-border py-24">
            <RevealItem>
              <Section
                eyebrow="03 / How it works"
                title="Four phases. Each phase hands its output to the next."
              />
            </RevealItem>
            <div className="flex items-stretch">
              {PHASES.map((phase, i) => (
                <Fragment key={phase.name}>
                  <RevealItem className="flex min-w-0 flex-1">
                    <Card
                      className="min-w-0 flex-1"
                      title={phase.name}
                      badge={<span className="micro tabular text-muted-foreground">0{i + 1}</span>}
                    >
                      <div className="micro text-muted-foreground">What you get</div>
                      <p className="mt-3 text-base leading-relaxed text-foreground">{phase.get}</p>
                    </Card>
                  </RevealItem>
                  {i < PHASES.length - 1 ? (
                    <RevealItem className="flex shrink-0 items-center">
                      <HandOver />
                    </RevealItem>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </RevealGroup>

          {/* 5 - What it does */}
          <RevealGroup className="border-t border-border py-24">
            <RevealItem>
              <Section
                eyebrow="04 / What it does"
                title="From choosing a node to living with the cap."
              />
            </RevealItem>
            <div className="grid grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <RevealItem key={feature.title} className="h-full">
                  <Card
                    className="h-full"
                    title={feature.title}
                    footer={
                      <div className="flex w-full flex-col gap-3">
                        {feature.snippet}
                        <IllustrationTag className="self-start" />
                      </div>
                    }
                  >
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {feature.body}
                    </p>
                  </Card>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </div>

        {/* 6 - Closing call to action */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-[1400px] px-8 py-24">
            <Reveal>
              <div className="flex items-end justify-between gap-16">
                <div>
                  <h2 className="max-w-[34ch] text-[40px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-foreground">
                    Your time-to-power drops by years, and you know the cost of the cap before you
                    sign.
                  </h2>
                  <p className="mt-6 max-w-[62ch] text-xl leading-relaxed text-muted-foreground">
                    Follow the journey end to end: where you can connect, on what terms, and what
                    living with the cap looks like.
                  </p>
                </div>
                <Link to="/demo" className="shrink-0">
                  <Button size="2xl">
                    Watch the demo
                    <ArrowRight />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
