# Scene 1 map outline - attribution

`germanyStates.ts` holds the outlines of the 16 German federal states, pre-projected to one SVG
path each and checked in, so the demo makes no network calls at runtime.

- **Source:** [deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON),
  file `2_bundeslaender/4_niedrig.geo.json` (low quality level).
- **Licence:** The Unlicense (public domain dedication).
- **Upstream data:** derived by that project from [DIVA-GIS](http://www.diva-gis.org/gdata)
  country data.

Processing: equirectangular projection with the x axis compressed by cos(51.2 deg), scaled to a
738 x 1000 viewBox, coordinates rounded to 0.1 px and points closer than 1.2 px dropped.

The shading comes from `public/data/regions.json` and is a **proxy estimate**, not measured
network capacity - the on-screen label says so.
