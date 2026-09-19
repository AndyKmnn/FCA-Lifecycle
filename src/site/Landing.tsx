import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  BRAND,
  Button,
  Card,
  Chip,
  COLORS,
  Footer,
  Navbar,
  Surface,
} from '../design'
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[13px] font-bold tracking-[0.14em] uppercase text-accent-deep">
      {children}
    </span>
  )
}

/** The visible hand-over between two phases: this phase's output is the next one's input. */
function HandOver() {
  return (
    <div aria-hidden className="flex w-24 flex-col items-center justify-center gap-2.5">
      <svg viewBox="0 0 72 22" className="w-[72px]" role="presentation">
        <path
          d="M3 11h50"
          stroke={COLORS.accentDeep}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
        <path d="M52 3 68 11 52 19z" fill={COLORS.accentDeep} />
      </svg>
      <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink-muted">
        feeds
      </span>
    </div>
  )
}

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-[1560px] flex-1 px-8">
        {/* 1 - Hero */}
        <section className="pt-12 pb-24">
          <Surface className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-center gap-12 px-14 py-14">
            <Reveal>
              <Chip tone="accent">Flexible Connection Agreements</Chip>
              <h1 className="mt-7 text-[58px] leading-[1.04] font-bold tracking-tight text-ink">
                {BRAND.tagline}
              </h1>
              <p className="mt-6 max-w-2xl text-2xl leading-snug text-ink-muted">
                You get connected years earlier - and we run the flexibility that made it
                possible.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-2.5">
                {AUDIENCE.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-5">
                <Link to="/demo">
                  <Button size="lg">Watch the demo</Button>
                </Link>
                <a
                  href="#how-it-works"
                  className="text-[15px] font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  See how it works
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <GridMotif className="w-full" />
            </Reveal>
          </Surface>
        </section>

        {/* 2 - The problem */}
        <section className="pb-24">
          <RevealGroup>
            <RevealItem>
              <Eyebrow>Where you are today</Eyebrow>
              <h2 className="mt-4 max-w-4xl text-[44px] leading-[1.1] font-bold tracking-tight text-ink">
                You have spent years waiting for a grid connection.
              </h2>
            </RevealItem>
            <div className="mt-12 grid grid-cols-3 gap-7">
              {PROBLEM.map((item) => (
                <RevealItem key={item.head} className="h-full">
                  <Surface className="h-full px-9 py-8">
                    <h3 className="text-2xl leading-snug font-bold text-ink">{item.head}</h3>
                    <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">{item.body}</p>
                  </Surface>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </section>

        {/* 3 - What a flexible connection is */}
        <section className="pb-24">
          <Reveal>
            <Surface variant="inset" className="px-14 py-14">
              <Eyebrow>Speed for firmness</Eyebrow>
              <h2 className="mt-4 max-w-4xl text-[44px] leading-[1.1] font-bold tracking-tight text-ink">
                A Flexible Connection Agreement trades firmness for speed.
              </h2>
              <p className="mt-5 max-w-4xl text-2xl leading-snug text-ink-muted">
                The grid operator connects you now; in return you accept a power limit at
                certain times.
              </p>
              <RevealGroup className="mt-12 grid grid-cols-3 gap-7" step={0.08}>
                {LIMITATION_TYPES.map((type) => (
                  <RevealItem key={type.name} className="h-full">
                    <Surface className="h-full px-8 py-7">
                      <Chip tone="accent">{type.name}</Chip>
                      <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
                        {type.body}
                      </p>
                    </Surface>
                  </RevealItem>
                ))}
              </RevealGroup>
            </Surface>
          </Reveal>
        </section>

        {/* 4 - How it works */}
        <section id="how-it-works" className="scroll-mt-8 pb-24">
          <RevealGroup>
            <RevealItem>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-4 max-w-4xl text-[44px] leading-[1.1] font-bold tracking-tight text-ink">
                Four phases. Each phase hands its output to the next.
              </h2>
            </RevealItem>
            <div className="mt-12 flex items-stretch">
              {PHASES.map((phase, i) => (
                <Fragment key={phase.name}>
                  <RevealItem className="flex min-w-0 flex-1">
                    <Card
                      className="min-w-0 flex-1"
                      title={phase.name}
                      badge={
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-base font-bold text-ink">
                          {i + 1}
                        </span>
                      }
                    >
                      <div className="text-[13px] font-bold tracking-[0.1em] uppercase text-ink-muted">
                        What you get
                      </div>
                      <p className="mt-3 text-[17px] leading-relaxed text-ink">{phase.get}</p>
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
        </section>

        {/* 5 - What it does */}
        <section className="pb-24">
          <RevealGroup>
            <RevealItem>
              <Eyebrow>What it does</Eyebrow>
              <h2 className="mt-4 max-w-4xl text-[44px] leading-[1.1] font-bold tracking-tight text-ink">
                From choosing a node to living with the cap.
              </h2>
            </RevealItem>
            <div className="mt-12 grid grid-cols-3 gap-7">
              {FEATURES.map((feature) => (
                <RevealItem key={feature.title} className="h-full">
                  <Card
                    className="h-full"
                    title={feature.title}
                    footer={
                      <div className="flex flex-col gap-4">
                        {feature.snippet}
                        <IllustrationTag className="self-start" />
                      </div>
                    }
                  >
                    <p className="text-[17px] leading-relaxed text-ink-muted">{feature.body}</p>
                  </Card>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </section>

        {/* 6 - Closing call to action */}
        <section className="pb-20">
          <Reveal>
            <Surface className="flex items-center justify-between gap-12 px-14 py-14">
              <div>
                <h2 className="max-w-3xl text-[40px] leading-[1.12] font-bold tracking-tight text-ink">
                  Your time-to-power drops by years, and you know the cost of the cap before you
                  sign.
                </h2>
                <p className="mt-5 max-w-2xl text-xl text-ink-muted">
                  Follow the journey end to end: where you can connect, on what terms, and what
                  living with the cap looks like.
                </p>
              </div>
              <Link to="/demo" className="shrink-0">
                <Button size="lg">Watch the demo</Button>
              </Link>
            </Surface>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
