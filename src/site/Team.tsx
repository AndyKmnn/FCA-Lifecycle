import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Chip, Footer, Navbar, Section, Stat, Surface } from '@/design'
import { Reveal, RevealGroup, RevealItem } from './Reveal'

/**
 * The team page at /team. Owned by the site track.
 *
 * Every figure here is a fact about us, not a simulation - so none of it carries a
 * Label. If the weeks below ever change, change them here: the copy reads from
 * WEEKS_EACH and the team list, and nothing else on the page hard-codes a number.
 *
 * Portraits are local files in public/team/<slug>.jpg - no network at runtime. A
 * missing file falls back to an initials monogram, so the page is never broken.
 */

/** Weeks each of us has spent in the utility space. */
const WEEKS_EACH = 4

interface Member {
  name: string
  /** public/team/<slug>.jpg */
  slug: string
  title: string
}

const TEAM: Member[] = [
  { name: 'Andy Kohlmann', slug: 'andy', title: 'Head of Getting Connected' },
  { name: 'Delong Chen', slug: 'delong', title: 'Keeper of the Load Curve' },
  { name: 'Nicola Lange', slug: 'nicola', title: 'Chief Cap Negotiator' },
  { name: 'Patryk Ostern', slug: 'patryk', title: 'Minister for Megawatts' },
  { name: 'Paul Cratzius', slug: 'paul', title: 'Curator of Substations' },
  { name: 'Sina Hagedorn', slug: 'sina', title: 'Department of Never Breaching the Cap' },
]

const WEEKS_COMBINED = WEEKS_EACH * TEAM.length

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

/**
 * A square, hairline-framed portrait. Grayscale so six photos taken in six
 * different places still read as one set.
 */
function Portrait({ member }: { member: Member }) {
  const [missing, setMissing] = useState(false)

  return (
    <div className="aspect-square w-full overflow-hidden rounded-md border border-border bg-muted">
      {missing ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="tabular text-[40px] leading-none font-semibold tracking-[-0.02em] text-muted-foreground">
            {initials(member.name)}
          </span>
        </div>
      ) : (
        <img
          src={`/team/${member.slug}.jpg`}
          alt={member.name}
          onError={() => setMissing(true)}
          className="h-full w-full object-cover grayscale"
        />
      )}
    </div>
  )
}

export function Team() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* 1 - Hero. Same ruled-paper grid as the landing page. */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="rule-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,#000_10%,transparent_70%)]"
          />
          <div className="relative mx-auto w-full max-w-[1400px] px-8 py-24">
            <Reveal>
              <Chip>The team</Chip>

              <h1 className="mt-8 max-w-[22ch] text-[64px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-foreground">
                Six of us, and every week we have has gone into this.
              </h1>

              <p className="mt-7 max-w-[62ch] border-l-2 border-border pl-5 text-xl leading-relaxed text-muted-foreground">
                We are not going to tell you we have spent decades in the utility space. We
                will tell you exactly how long we have spent, and what we did with it.
              </p>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1400px] px-8">
          {/* 2 - The honest count */}
          <RevealGroup className="py-24">
            <RevealItem>
              <Section
                eyebrow="01 / Where this comes from"
                title="We did not find this problem in a slide deck."
              />
            </RevealItem>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-start gap-16">
              <RevealItem>
                <p className="max-w-[62ch] text-xl leading-relaxed text-muted-foreground">
                  Six people went into the utility space and came back with the same
                  complaint from every side of it: the queue is measured in years, and
                  nobody can tell you what the cap will cost you before you sign. Short
                  time, spent narrowly. All of it on flexible connections.
                </p>
              </RevealItem>

              <RevealItem>
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Each of us" value={WEEKS_EACH} unit="weeks" className="min-w-0" />
                  <Stat
                    label="Combined"
                    value={WEEKS_COMBINED}
                    unit="weeks"
                    className="min-w-0"
                  />
                  <Stat label="On one problem" value="100" unit="%" className="min-w-0" />
                </div>
              </RevealItem>
            </div>
          </RevealGroup>

          {/* 3 - The SAP project */}
          <RevealGroup className="border-t border-border py-24">
            <RevealItem>
              <Section
                eyebrow="02 / We have built together before"
                title="Six weeks with SAP, at the CDTM Trend Seminar."
              />
            </RevealItem>

            <div className="grid grid-cols-3 gap-6">
              <RevealItem className="h-full">
                <Surface className="h-full px-7 py-7">
                  <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] text-foreground">
                    The same six people.
                  </h3>
                  <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                    Not a team assembled for this pitch. The team that already shipped
                    something together, with the same names on it.
                  </p>
                </Surface>
              </RevealItem>

              <RevealItem className="h-full">
                <Surface className="h-full px-7 py-7">
                  <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] text-foreground">
                    A corporate partner, not a classroom.
                  </h3>
                  <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                    SAP set the brief in the Trend Seminar at CDTM. We worked to it for six
                    weeks and delivered against it.
                  </p>
                </Surface>
              </RevealItem>

              <RevealItem className="h-full">
                <Surface className="h-full px-7 py-7">
                  <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] text-foreground">
                    We know how this team runs.
                  </h3>
                  <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                    Six weeks against a deadline tells you who does what under pressure.
                    Grid Smash is the second time, not the first.
                  </p>
                </Surface>
              </RevealItem>
            </div>
          </RevealGroup>

          {/* 4 - The six */}
          <RevealGroup className="border-t border-border py-24">
            <RevealItem>
              <Section eyebrow="03 / Who you would be working with" title="The six." />
            </RevealItem>

            <div className="grid grid-cols-3 gap-6">
              {TEAM.map((member) => (
                <RevealItem key={member.slug} className="h-full">
                  <Surface className="h-full px-7 py-7">
                    <Portrait member={member} />
                    <h3 className="mt-6 text-lg leading-snug font-semibold tracking-[-0.01em] text-foreground">
                      {member.name}
                    </h3>
                    <p className="micro mt-2 text-muted-foreground">{member.title}</p>
                  </Surface>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </div>

        {/* 5 - Closing call to action */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-[1400px] px-8 py-24">
            <Reveal>
              <div className="flex items-end justify-between gap-16">
                <div>
                  <h2 className="max-w-[34ch] text-[40px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-foreground">
                    {WEEKS_COMBINED} weeks in, this is what we have built.
                  </h2>
                  <p className="mt-6 max-w-[62ch] text-xl leading-relaxed text-muted-foreground">
                    Follow the journey end to end: where you can connect, on what terms, and
                    what living with the cap looks like.
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
