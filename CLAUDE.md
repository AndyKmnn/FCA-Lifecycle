# Grid Smash - working rules

Demo website for a live pitch. Speed and reliability beat completeness.

## Non-negotiables

- **Demo only.** The site must run **offline** and **deterministically**: no backend, no login,
  no network calls at runtime, no random values without a fixed seed. Every run of the demo looks
  identical.
- **No invented facts.** All site copy comes from `docs/PRODUCT.md`. All demo numbers come from
  `docs/DEMO_SCRIPT.md` and the generated data in `public/data/`. If something is not in those
  files, do not put it on screen.
- **Customer-facing product website, not a pitch deck.** Never show investor or internal
  material: no business model or revenue lines, no moat, no competition, no market size, no
  assumptions-and-risks list, no legal or funding timeline. If `docs/PRODUCT.md` ever contains
  such material, ignore it for the site.
- **Label every simulated number.** Any simulated or proxy figure on screen carries a visible
  label - `Simulation`, `Proxy estimate` or `Assumption` - using the `Label` component from
  `src/design`.
- **Do not rewrite existing copy.** Restyle and re-lay-out freely, but the words already on the
  site and in `docs/` stay as they are.
- **The product name lives in one place:** `src/design/brand.ts`. Use it for the navbar, page
  title, end card and README. **Never show "FCA-Lifecycle" on the site** - that is only the
  repository and folder name.

## Scope

- Landing page at `/` and one scripted three-scene demo at `/demo`. Plus `/design` (component
  gallery, internal).
- Light theme only. Designed for a **1920x1080 projector**. English.
- No tests beyond `npm run build` passing.
- Dependencies are fixed: Vite, React, TypeScript, Tailwind CSS, React Router, Framer Motion,
  Recharts, and shadcn/ui with its runtime (`radix-ui`, `class-variance-authority`, `cn`,
  `lucide-react`, `tw-animate-css`, `@fontsource-variable/geist`). **Ask before adding anything
  else.** Adding a shadcn primitive with `npx shadcn@latest add <name>` is fine, on `main` only.

## Folder ownership (parallel tracks)

| Path | Owner |
|---|---|
| `src/site` | **site** track |
| `src/demo/scene1`, `src/demo/scene2` | **demo12** track |
| `src/demo/scene3` | **demo3** track |
| `src/design`, `src/data`, `src/shell`, `public/data`, `docs` | **shared and frozen** |

Shared folders are frozen after the scaffold prompt. If you need a change there, ask - do not
edit them from a track branch. Scene components are imported by the shell from their own folder,
so no track ever edits the shell.

Assets that belong to one scene only (for example an SVG map outline used by scene 1) live in
that scene's own folder, not in `public/data`.

## Design

**Read `docs/DESIGN_HANDOFF.md` before writing any UI.** It is the full system in one page.

shadcn/ui on a German-precision-instrument aesthetic: hairline borders instead of shadows,
8 px radii, generous whitespace, tabular figures, Geist. Amber `#F5A623` is a signal, not
decoration - one amber thing per screen. Ink navy `#0E1B3A`. Text contrast at least 4.5:1.
**Charts and maps stay flat.**

Every colour, radius and font lives in `src/design/theme.css` and nowhere else. Change
`--brand-amber` there and the whole site follows. Import components from `@/design`; never
hard-code a colour or hand-roll a panel. `/design` renders the whole gallery.

## Presenter view

`/demo` is full screen with no scrolling. Scene indicator 1-2-3. Right arrow or space = next,
left arrow = back, `R` = restart.
