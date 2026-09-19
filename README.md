# Grid Smash

Demo website for a live pitch: a landing page and one scripted three-scene demo at `/demo`.

Offline and deterministic - no backend, no login, no network calls at runtime. Every run of the
demo shows identical numbers, because all data is generated once by a seeded script.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # the only test that has to pass
npm run preview
```

## Routes

| Route | What |
|---|---|
| `/` | Landing page |
| `/demo` | Presenter view, full screen, 1920x1080. Right arrow / space: next, left arrow: back, `R`: restart |
| `/design` | Component gallery (internal) |

## Layout

```
docs/          PRODUCT.md (all site copy) and DEMO_SCRIPT.md (all demo numbers)
scripts/       generate-data.mjs - the one seeded generator
public/data/   profile.json, limits.json, regions.json
src/design/    neumorphic design system, brand.ts holds the product name
src/data/      typed loaders for public/data
src/shell/     routes and the presenter view
src/site/      landing page              (site track)
src/demo/scene1, scene2/                 (demo12 track)
src/demo/scene3/                         (demo3 track)
```

`src/design`, `src/data`, `src/shell`, `public/data` and `docs` are shared and frozen. See
`CLAUDE.md` for the full working rules.

## Regenerating the data

```bash
node scripts/generate-data.mjs
```

Deterministic - same seed, same files. It prints the computed results; `docs/DEMO_SCRIPT.md`
quotes them.
