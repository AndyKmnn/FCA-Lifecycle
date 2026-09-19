# Scene 1 map outlines - attribution

Both outlines are pre-projected to SVG paths and checked in, so the demo makes no network calls
at runtime.

## `germanyStates.ts` - the 16 German federal states

- **Source:** [deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON),
  file `2_bundeslaender/4_niedrig.geo.json` (low quality level).
- **Licence:** The Unlicense (public domain dedication).
- **Upstream data:** derived by that project from [DIVA-GIS](http://www.diva-gis.org/gdata)
  country data.
- **Generator:** `make-germany-states.mjs` in this folder, run by hand against the downloaded
  GeoJSON.

Processing: equirectangular projection with the x axis compressed by cos(51.2 deg), scaled to a
738 x 1000 viewBox, coordinates rounded to 0.1 px and points closer than 1.2 px dropped.

## `europeOutline.ts` - western and central Europe

- **Source:** Natural Earth 1:110m Admin 0 Countries.
- **Licence:** public domain (CC0), <https://www.naturalearthdata.com/>.
- **Generator:** `make-europe-outline.mjs` in this folder, run by hand against the downloaded
  GeoJSON: `node src/demo/scene1/make-europe-outline.mjs <ne_110m_admin_0_countries.geojson>`.

Processing, as that script does it: keep the features whose `CONTINENT` is `Europe`, keyed by
`ISO_A2_EH` (falling back to `ISO_A2`); crop to the bounding box lon -11 to 31, lat 35 to 60 -
a ring is kept only if at least one of its points falls inside the box, and every point is then
clamped to the box edges; equirectangular projection with the x axis compressed by cos(52 deg);
scaled by 40 px per degree of latitude to a 1034 x 1000 viewBox; coordinates rounded to 0.1 px,
a point dropped when it is within 1.5 px of the previous one on both axes, and a ring dropped
when fewer than 3 points survive. The baked file holds 38 country paths; `HOME_COUNTRY` is `DE`,
the one the map picks out before zooming in.

Neither map is shaded by measured network capacity. The district tints in `DistrictMap` only tell
the four fictional operator districts of `public/data/districts.json` apart, and the site pin and
the district label positions come from the coordinates in `public/data/regions.json`, whose
headroom scores are a **proxy estimate** - the on-screen label says so.
