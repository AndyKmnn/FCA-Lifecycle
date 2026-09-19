import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Chip } from './Chip'
import { Counter } from './Counter'
import { Footer } from './Footer'
import { Label } from './Label'
import { Navbar } from './Navbar'
import { Stat } from './Stat'
import { Stepper } from './Stepper'
import { Surface } from './Surface'
import { Toggle } from './Toggle'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-5 text-sm font-bold tracking-[0.12em] uppercase text-ink-muted">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-6">{children}</div>
    </section>
  )
}

/** Internal component gallery at /design. Not linked from the site. */
export function Gallery() {
  const [on, setOn] = useState(true)
  const [step, setStep] = useState(1)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[1560px] flex-1 px-8 py-12">
        <h1 className="text-4xl font-bold text-ink">Design system</h1>
        <p className="mt-2 text-lg text-ink-muted">
          Neumorphism, light theme. Panels and controls are raised, pressed or inset. Charts and
          maps stay flat.
        </p>

        <Section title="Surface">
          {(['raised', 'pressed', 'inset', 'flat'] as const).map((variant) => (
            <Surface key={variant} variant={variant} className="grid h-32 w-56 place-items-center">
              <span className="font-semibold text-ink">{variant}</span>
            </Surface>
          ))}
        </Section>

        <Section title="Button">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="lg">Large primary</Button>
          <Button disabled>Disabled</Button>
        </Section>

        <Section title="Chip">
          <Chip>Default</Chip>
          <Chip selected>Selected</Chip>
          <Chip tone="accent">Accent</Chip>
        </Section>

        <Section title="Toggle">
          <Toggle checked={on} onChange={setOn} label="Battery as compliance asset" />
          <Toggle checked={false} onChange={() => {}} label="Off" />
          <Toggle checked disabled onChange={() => {}} label="Disabled" />
        </Section>

        <Section title="Label">
          <Label kind="simulation" />
          <Label kind="proxy" note="illustrative" />
          <Label kind="assumption" />
        </Section>

        <Section title="Counter">
          <Surface className="px-8 py-6">
            <div className="text-5xl font-bold text-ink">
              <Counter value={40} suffix=" months" />
            </div>
          </Surface>
          <Surface className="px-8 py-6">
            <div className="text-5xl font-bold text-ink">
              <Counter value={4.6} decimals={1} prefix="EUR " suffix="m" />
            </div>
          </Surface>
        </Section>

        <Section title="Stat">
          <Stat label="Hours affected" value={<Counter value={94} />} unit="h" tag="simulation" />
          <Stat label="Energy at risk" value={<Counter value={56} />} unit="MWh" hint="0.3% of the year" tag="simulation" />
          <Stat label="Gross margin" value="250" unit="EUR/MWh" tag="assumption" />
        </Section>

        <Section title="Stepper">
          <Stepper
            steps={['Headroom map', 'Upload and term sheet', 'Autopilot replay']}
            current={step}
            onSelect={setStep}
          />
        </Section>

        <Section title="Card">
          <Card
            title="Static cap 3.5 MW"
            subtitle="A fixed cap, all year"
            badge={<Chip>Option A</Chip>}
            className="w-80"
            footer={<span className="text-sm text-ink-muted">Cost before battery</span>}
          >
            <p className="text-ink-muted">Body content.</p>
          </Card>
          <Card
            title="Fully dynamic"
            subtitle="Day-ahead limits, 2.5-6.0 MW"
            badge={<Chip tone="accent">Recommended</Chip>}
            highlight
            className="w-80"
          >
            <p className="text-ink-muted">Highlighted variant.</p>
          </Card>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
