# Grid Smash - design handoff

**Read this before writing any UI.** It is the whole design system in one page. If you are an
agent working on `feat/site`, `feat/demo12` or `feat/demo3`, adopting this is not optional -
three tracks that each invent their own styling produce three different websites.

First: `git merge main` (or rebase onto it). The design system below only exists on `main`.

---

## 1. The rule that replaces taste

**Import from `@/design`. Never style from scratch, never hard-code a colour.**

```tsx
import { Button, Card, Chip, Counter, Label, Section, Stat, Stepper, Surface } from '@/design'
```

If you catch yourself writing `#0E1B3A`, `bg-slate-100`, `text-gray-500`, `rounded-3xl` or a
`box-shadow`, stop - there is a token or a component for it.

| Need | Use | Never |
|---|---|---|
| Any colour | `bg-primary`, `text-muted-foreground`, `border-border` | a hex value, `slate-*`, `gray-*`, `zinc-*` |
| A panel | `<Surface>` | a hand-rolled `div` with a border |
| A figure on screen | `<Stat>` / `<Counter>` | raw `<span>{n}</span>` |
| A page block | `<Section eyebrow="02" title="...">` | a bare `<h2>` |
| A button | `<Button size="xl">` | `<button className="...">` |
| A chart colour | `CHART.series`, `CHART_SERIES[i]` | a hex value |

## 2. Where things live

```
src/design/
  theme.css      <- EVERY colour, radius and font. The only place they are defined.
  tokens.ts      <- chart colours + shared Recharts axis props
  brand.ts       <- the product name. Never hard-code "Grid Smash", never show "FCA-Lifecycle"
  ui/            <- shadcn primitives (button, card, badge, switch, tabs, tooltip, ...)
  *.tsx          <- Grid Smash components composed on top of ui/
  index.ts       <- the single import surface
  Gallery.tsx    <- /design route: every component, rendered. Look here before you build.
```

`src/design` is **shared and frozen**. Need a new component or a token change? Ask on `main` -
do not add it on a track branch, or three tracks will each ship a different `Card`.

Adding a shadcn primitive is the one exception, and only on `main`:

```bash
npx shadcn@latest add <name>   # lands in src/design/ui, aliases are already configured
```

## 3. The look: German precision instrument

Elegance through simplicity. The reference points are Braun, Vitsoe and a good spec sheet -
not a SaaS landing page.

- **Hairlines, not shadows.** Structure comes from 1 px `border-border` rules. `shadow-xs` at
  most; never `shadow-lg`, never a glow, never a gradient fill.
- **Restrained radii.** `--radius` is 8 px. Nothing is pill-shaped except a Badge.
- **Amber is a signal, not decoration.** `--brand-amber` marks exactly one thing per screen:
  the primary action, the recommended option, the live step. A screen with three amber things
  has none.
- **Whitespace is the layout.** Generous padding, `max-w-[1400px]`, aligned baselines.
- **Numbers are instruments.** Every figure gets `tabular` (or `<Counter>` / `<Stat>`, which
  apply it). Units in `font-mono` next to the figure, never inside it.
- **Micro captions.** `className="micro"` gives the wide-tracked uppercase caption used above
  headings and inside labels.
- **The ruled grid.** `className="rule-grid"` is the faint engineering grid. Behind a hero or a
  stage, always masked or at low opacity. Never behind body text.
- **Charts and maps stay flat.** Hairline axes in `CHART.axis`, grid in `CHART.grid`, no
  shadows, no 3D, no gradient area fills. Spread `AXIS_PROPS` onto Recharts axes.

## 4. Type scale

| Role | Class |
|---|---|
| Hero | `text-[64px] font-semibold tracking-[-0.035em]` |
| Scene title | `text-[52px] font-semibold tracking-[-0.03em]` |
| Section title | `text-[28px] font-semibold tracking-[-0.02em]` |
| Stat figure | `text-[40px] font-semibold tabular` |
| Body | `text-lg` / `text-xl` on the projector, `text-sm` in panels |
| Caption | `micro` |

Font is Geist Variable, self-hosted via `@fontsource-variable/geist`. **Never add a webfont
`<link>`** - the demo must run with no network.

## 5. Non-negotiables you can still break by accident

- **Offline.** No runtime `fetch` except same-origin `public/data/*` through `src/data`
  loaders. No CDN, no Google Fonts, no analytics.
- **Deterministic.** No `Math.random()`, no `new Date()` driving anything visible. The data is
  pre-seeded; the same run must look identical tomorrow.
- **Label sparingly.** The scenario is established once, at the start; after that the interface
  behaves like the real product. `<Label kind="simulation" />`, `kind="proxy"` and
  `kind="assumption"` are for the rare figure that would otherwise be read as sourced market
  data - a headroom estimate, an assumed margin. One per screen at most, and usually none. A
  panel covered in badges reads as a prototype apologising for itself. See CLAUDE.md.
- **Do not change existing copy.** Site text comes from `docs/PRODUCT.md`, demo figures from
  `docs/DEMO_SCRIPT.md`. Restyle freely; do not rewrite words.
- **No investor material on the site.** No business model, revenue, moat, competition, market
  size, risks or funding timeline.
- **Projector.** The presenter view renders on a fixed 1920x1080 stage (`src/shell/Stage.tsx`)
  and never scrolls. Lay scenes out in real pixels against that box.

## 6. Scene contract

Your scene is a default export taking `SceneProps` from `src/shell/types`:

```tsx
export default function SceneN({ onAdvance, onRestart }: SceneProps) { ... }
```

The shell imports it, animates it in and owns the keyboard. **Do not edit `src/shell`.**
Scene-only assets (an SVG map outline, for example) live in your own scene folder, never in
`public/data`.

## 7. Before you push

```bash
npm run build     # the only test that has to pass
```

Then open `/design` and put your screen next to the gallery. If it looks like a different
product, it is wrong.
