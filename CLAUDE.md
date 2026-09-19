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
- **The product name lives in one place:** `src/design/brand.ts`. Use it for the navbar, page
  title, end card and README. **Never show "FCA-Lifecycle" on the site** - that is only the
  repository and folder name.

## Scope

- Landing page at `/` and one scripted three-scene demo at `/demo`. Plus `/design` (component
  gallery, internal).
- Light theme only. Designed for a **1920x1080 projector**. English.
- No tests beyond `npm run build` passing.
- Dependencies are fixed: Vite, React, TypeScript, Tailwind CSS, React Router, Framer Motion,
  Recharts. **Ask before adding anything else.**

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

Neumorphism, defined in `src/design`. Surface `#E6EBF2`, light shadow `#FFFFFF`, dark shadow
`#C3CAD6`, accent amber `#F5A623`, ink navy `#0E1B3A`, radius 16-24 px. Text contrast at least
4.5:1. **Charts and maps stay flat** - only panels and controls are neumorphic.

## Presenter view

`/demo` is full screen with no scrolling. Scene indicator 1-2-3. Right arrow or space = next,
left arrow = back, `R` = restart.
