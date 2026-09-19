import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Chip } from './Chip'
import { Counter } from './Counter'
import { Footer } from './Footer'
import { Label } from './Label'
import { Navbar } from './Navbar'
import { Section } from './Section'
import { Stat } from './Stat'
import { Stepper } from './Stepper'
import { Surface } from './Surface'
import { Toggle } from './Toggle'
import { Separator } from './ui/separator'

const SWATCHES = [
  ['--brand-amber', 'primary'],
  ['--brand-navy', 'foreground'],
  ['--grey-05', 'muted'],
  ['--grey-20', 'border'],
  ['--grey-70', 'muted-foreground'],
  ['--signal-ok', 'ok'],
  ['--signal-warn', 'warn'],
  ['--signal-risk', 'destructive'],
] as const

/** Internal component gallery at /design. Not linked from the site. */
export function Gallery() {
  const [on, setOn] = useState(true)
  const [step, setStep] = useState(1)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-16">
        <span className="micro text-muted-foreground">Internal</span>
        <h1 className="mt-3 text-[44px] leading-none font-semibold tracking-[-0.03em] text-foreground">
          Design system
        </h1>
        <p className="mt-5 max-w-[70ch] text-lg text-muted-foreground">
          shadcn/ui primitives in <code className="font-mono text-[15px]">src/design/ui</code>,
          Grid Smash components beside them. Every colour comes from{' '}
          <code className="font-mono text-[15px]">src/design/theme.css</code>. Charts and maps stay
          flat.
        </p>

        <Separator className="my-14" />

        <Section eyebrow="01" title="Palette" aside={<Chip>src/design/theme.css</Chip>}>
          <div className="grid grid-cols-4 gap-4">
            {SWATCHES.map(([variable, role]) => (
              <Surface key={variable} className="overflow-hidden p-0">
                <div className="h-20 w-full" style={{ background: `var(${variable})` }} />
                <div className="border-t border-border px-4 py-3">
                  <div className="font-mono text-[13px] text-foreground">{variable}</div>
                  <div className="micro mt-1 text-muted-foreground">{role}</div>
                </div>
              </Surface>
            ))}
          </div>
        </Section>

        <div className="h-14" />

        <Section eyebrow="02" title="Surface">
          <div className="grid grid-cols-4 gap-5">
            {(['raised', 'pressed', 'inset', 'flat'] as const).map((variant) => (
              <Surface key={variant} variant={variant} className="grid h-28 place-items-center">
                <span className="font-mono text-sm text-muted-foreground">{variant}</span>
              </Surface>
            ))}
          </div>
        </Section>

        <div className="h-14" />

        <Section eyebrow="03" title="Controls">
          <div className="flex flex-wrap items-center gap-4">
            <Button size="xl">Primary</Button>
            <Button size="xl" variant="outline">
              Outline
            </Button>
            <Button size="xl" variant="secondary">
              Secondary
            </Button>
            <Button size="xl" variant="ghost">
              Ghost
            </Button>
            <Button size="xl" disabled>
              Disabled
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Chip>Default</Chip>
            <Chip selected>Selected</Chip>
            <Chip tone="accent">Accent</Chip>
            <Separator orientation="vertical" className="h-7" />
            <Toggle checked={on} onChange={setOn} label="Battery as compliance asset" />
            <Toggle checked={false} onChange={() => {}} label="Off" />
          </div>
        </Section>

        <div className="h-14" />

        <Section
          eyebrow="04"
          title="Provenance labels"
          aside={<span className="text-sm text-muted-foreground">Required on every figure</span>}
        >
          <div className="flex flex-wrap items-center gap-4">
            <Label kind="simulation" />
            <Label kind="proxy" note="illustrative" />
            <Label kind="assumption" />
          </div>
        </Section>

        <div className="h-14" />

        <Section eyebrow="05" title="Readouts">
          <div className="grid grid-cols-4 gap-5">
            <Stat label="Hours affected" value={<Counter value={94} />} unit="h" tag="simulation" />
            <Stat
              label="Energy at risk"
              value={<Counter value={56} />}
              unit="MWh"
              hint="0.3% of the year"
              tag="simulation"
            />
            <Stat label="Gross margin" value="250" unit="EUR/MWh" tag="assumption" />
            <Stat
              label="Queue skipped"
              value={<Counter value={40} />}
              unit="months"
              tag="simulation"
            />
          </div>
        </Section>

        <div className="h-14" />

        <Section eyebrow="06" title="Stepper">
          <Stepper
            steps={['Headroom map', 'Upload and term sheet', 'Autopilot replay']}
            current={step}
            onSelect={setStep}
          />
        </Section>

        <div className="h-14" />

        <Section eyebrow="07" title="Cards">
          <div className="grid grid-cols-3 gap-5">
            <Card
              title="Static cap 3.5 MW"
              subtitle="A fixed cap, all year"
              badge={<Chip>Option A</Chip>}
              footer={<span className="text-sm text-muted-foreground">Cost before battery</span>}
            >
              <p className="text-sm text-muted-foreground">Body content.</p>
            </Card>
            <Card
              title="Dynamic 3.0-6.0 MW"
              subtitle="Seasonal, by time of day"
              badge={<Chip>Option B</Chip>}
              footer={<span className="text-sm text-muted-foreground">Cost before battery</span>}
            >
              <p className="text-sm text-muted-foreground">Body content.</p>
            </Card>
            <Card
              title="Fully dynamic"
              subtitle="Day-ahead limits, 2.5-6.0 MW"
              badge={<Chip tone="accent">Recommended</Chip>}
              highlight
              footer={<span className="text-sm text-muted-foreground">Cost before battery</span>}
            >
              <p className="text-sm text-muted-foreground">Highlighted variant.</p>
            </Card>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
