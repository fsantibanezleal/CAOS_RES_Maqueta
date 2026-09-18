# Changelog

All notable changes to Maqueta. Format: [Keep a Changelog](https://keepachangelog.com/); versions use
`X.XX.XXX` (display). `0.x` while the place set and API stabilize. Tag every release.

## [0.09.000] - 2026-09-18

Collects the CI and deploy repair of #10/#11/#12, released to `main` without a version bump, and #13. No
bundle content changed: the 118 places, their manifests, `index.json` and `benchmark.json` are the same data.

### Added
- A CI that passes: lint, tests, a pipeline smoke (the place index and benchmark regenerate from the
  committed bundles, byte for byte), a CONTRACT 2 check in both directions, template-residue and content
  guards, and a web job that type-checks, tests and builds the SPA.
- `VERSION`, the display version and single source of truth, and a test that keeps it, `frontend/package.json`
  (semver form), its lock file and this CHANGELOG in step. This supersedes the version-coherence PR #7.
- `data-pipeline/requirements-bake.txt`: the bake lane, geoscena pinned to CAOS_GeoScena commit `ab0bbf8`, the
  source the committed bundles match (not the 0.1.0 release on PyPI).
- Docs written from the code and the manifests (architecture, cases, frameworks, guides), replacing the
  archetype's example residue.

### Changed
- The pipeline is plain code run by path, `python data-pipeline/run.py bake | regen-index | gen-admin`, no
  longer the installed internal package `maquetalab` (a product declares no package of its own). Replace
  `python -m maquetalab.pipeline`, `.regen_index` and `.gen_admin` with those three commands.
- `regen-index` is the single writer of `index.json` and `benchmark.json`, run after meshopt compression, so
  the recorded byte sizes are the shipped ones and a one-place bake keeps the other places; it writes LF on
  every OS.
- A re-bake removes a place's previous layer files before writing the new bundle.
- The SPA is built with root-absolute URLs (Vite `base: '/'`), and `index.html` is served with
  `Cache-Control: no-cache` (the sample nginx config and the live host).

### Fixed
- Deep links with a trailing slash (`/benchmark/`, ...) loaded the page's script from under the route,
  received the HTML fallback instead and stayed blank.
- UI text, EN and ES: the footer said the code is Apache-2.0 (it is MIT); the architecture modal and the
  Implementation page said geoscena is on PyPI (only 0.1.0 is, without most of the fetchers the bundles use);
  the modal listed USGS 3DEP as a source (no bundle uses it), showed a local machine path and said the
  browser contacts no provider (the optional satellite drape does); missing Spanish accents in the footer.
- `gen_admin` meant to prefer a sibling CAOS_GeoScena checkout but built the path inside this repository.

### Removed
- The template's GitHub Pages workflow: Pages was never enabled and the built site is about 1.8 GB, above
  the Pages limit; Maqueta is served as a static nginx site.
- 17 stale layer files that no manifest named (23.9 MB), from the repository and from the live host, the
  template's SIR example data and its placeholder diagrams.
- The unused `uplot` dependency.

[0.09.000]: https://github.com/fsantibanezleal/CAOS_RES_Maqueta/releases/tag/v0.09.000

## [0.08.000] - 2026-07-14

### Added
- **Analytical layers (multi-modal fusion, the headline).** Satellite multispectral NDVI/NDWI/NDBI per
  building (least-cloud Sentinel-2 L2A via the Earth Search STAC), a per-place environment block (solar PV
  yield + GHI from PVGIS; temperature/wind/precipitation from Open-Meteo ERA5), and Chilean Data Observatory
  indicators (health facilities, foreign-born residents, schools) joined per comuna.
- **Aggregate-by-admin-area, everywhere.** `gen_admin` writes `admin.json` at the finest geoBoundaries level
  that spans >=2 units (ADM3 comuna/ward/district -> ADM2 -> ADM1) for 67 places; the tool has three bands,
  building averages, environment (solar/climate), and Data Observatory, each driving a choropleth + ranked
  table. Each unit carries its own solar/climate + indicators, sampled at the unit centroid.
- **11 world metro-core AOIs** (New York, London, Paris, Berlin, Barcelona, Tokyo, Seoul, Delhi, Mexico City,
  Buenos Aires, Sao Paulo), sized to span official boroughs/wards/arrondissements/districts/comunas so the
  sub-area aggregation works globally, not only for Santiago.
- **Environment readout panel** per place, and **selected-building metric readout**: clicking a building
  shows the active metric's value, its own for per-building attributes, or its comuna's value for
  solar/climate/Data-Observatory layers (labelled with the area name).

### Changed
- **Content pages rebuilt to ADR-0016** (SubTabs/Tabs per topic + KaTeX + theme-aware bilingual SVG figures
  + assumptions Callouts + per-section DOI Refs). Methodology is 8 method-family sub-tabs; Introduction,
  Implementation and Experiments gain figures and tab structure. 8 new real citations.
- **UX**: default UI language is English; the controls panel and every section start collapsed; the place
  picker sorts each category alphabetically in the selected language and lists the metro cores first; the
  footer provenance names every fused source.

### Fixed
- A single place's manifest load failure used to replace the whole page with an error (removing the place
  picker); it now shows inline and the picker stays.

## [0.07.000] - 2026-07-13

### Added
- **29 new places (107 total).** Chile: Calama, Antofagasta, Sierra Gorda, Valdivia, Chiloe (Castro).
  World metros: Shanghai, Beijing, Hong Kong, Delhi, Bangkok, Jakarta, Dubai, Los Angeles, Chicago, Lagos.
  Iconic landmarks + landscapes: Giza Pyramids, Machu Picchu, Taj Mahal (Agra), Great Wall, Petra, Angkor
  Wat, Mount Fuji, Rio de Janeiro, Venice, Matterhorn, Yosemite, Victoria Falls, Santorini, Monument Valley.
  18 of the 107 places are terrain-only (no buildings).
- **Searchable, categorized place picker.** Replaces the native select (unusable at 100+ places): type to
  filter by city / country / landmark; built places are grouped by continent with sticky headers, and the
  terrain-only areas have their own "Terrain & landscapes" group.

### Changed
- **Cinematic default view.** The app opens on a low oblique that fills the frame with the built fabric and
  lets it recede to the far relief hazing into the sky.
- **Terrain rendering overhaul** (fixes terrain-first places rendering off-screen and as a transparent/grey
  surface). Meshes carry absolute altitude, so high places (Chuquicamata and Atacama at ~2500 m, Bogota
  ~2600 m) rendered above the top of the frame; the camera, ground-pick and area tool now frame at the
  scene's actual mean elevation. The terrain renders DoubleSide with flipped normals (the baked TIN winding
  was inverted, back-face-culling the flat surface). A hillshade + earthy hypsometric ramp with
  altitude-gated snow caps is baked into the vertex colours and rendered lighting-independent, so
  terrain-first places read as solid coloured landscapes (Mount Fuji as a snow-capped cone, Chuquicamata
  as a coloured pit + ridges), cities sit on visible coloured ground with the Andes as earthy relief, and
  city relief never crushes to black.
- **Default colour = Function** when the place has building-function data (else height).

### Fixed
- Open Buildings 2.5D fetcher (`geoscena`): a `/vsicurl` COG open on GCS triggered a full bucket directory
  listing; added `GDAL_DISABLE_READDIR_ON_OPEN` + HTTP timeout/retries (mirrors `rastermod.py`), cutting
  each Global-South height fetch from minutes to seconds.

[0.07.000]: https://github.com/fsantibanezleal/CAOS_RES_Maqueta/releases/tag/v0.07.000

## [0.06.000] - 2026-07-13

### Added
- **Area statistics tool.** Draw a polygon over the map (a barrio, a block, a corridor) or take the whole
  place, and get the fused building attributes summarized over that sub-area: building count, polygon area,
  total footprint area, built cover ratio, density per km2, built-volume proxy, height mean/median/p90/max,
  mean/max floors, a height-distribution histogram, and function / land-cover / height-provenance mix bars.
  Point-in-polygon over per-building footprint centroids (baked once at load); the region draws as a bright
  boundary, a soft ground fill and a translucent vertical curtain so it reads clearly among tall buildings.
- 78 places: the 40 curated set + full Santiago metro core + 37 Gran Santiago comunas as cases (default
  Providencia).
- LoD2 authoritative ground-truth as a distinct amber overlay layer (3DBAG, Delft + Amsterdam), toggleable
  against the fused buildings.
- Soil organic carbon (SoilGrids, CC-BY) fused as a per-building modality on non-urban-masked places.

### Changed
- **Map-first layout:** full-bleed 3D map with a floating, collapsible glassy control panel (layers /
  colour / filter / area / scene); selection and area-stats float bottom-left, legend bottom-right.
- **Building visualization overhaul:** solid 3D read via a baked per-vertex vertical ambient-occlusion
  gradient plus flat-shaded faces and ACES filmic tone mapping (no more flat blocks).
- **Terrain fix:** removed the black band over steep relief (the Andes) by dropping meshopt-collapsed
  degenerate triangles, computing clean normals for hill-shading, adding a grey self-illumination floor,
  and tightening the atmospheric fog so far relief hazes into the sky.
- Delivery: meshopt compression + 2-tier LoD + progressive load + gzip.

### Fixed
- 3DBAG `metadata.transform` is document-level, not per-feature: applying it correctly both enabled the LoD2
  layer and repaired the silently-broken height benchmark.

[0.06.000]: https://github.com/fsantibanezleal/CAOS_RES_Maqueta/releases/tag/v0.06.000

## [0.01.000] - 2026-07-13

### Added
- Instantiated from the CAOS product-repo template (ADR-0057); the template's example package became `maquetalab`.
- `maquetalab` pipeline over the `geoscena` core: the 40-place tiered registry (`places.py`), the bake
  wrapper (`build.py`), the orchestrator + CLI (`pipeline.py`), and the cross-place benchmark (`benchmark.py`).
- Frontend (React + Three.js over `@fasl-work/caos-app-shell`): the App workbench (place selector + 3D
  viewer with Fresnel/neon/bloom shader identity, raycast building read-out of height + provenance, layer
  toggles, camera presets, paused-by-default animation), plus Introduction / Methodology (KaTeX) /
  Implementation / Experiments / Benchmark pages, the ADR-0058 architecture modal (5 themed SVG diagrams),
  EN/ES i18n and light/dark theming.
- CONTRACT-2 TypeScript mirror of the SceneBundle manifest (`contract.types.ts`).
- First place baked end-to-end and verified on real data: Berlin Mitte (terrain + buildings + roads +
  water + green + rail), height provenance mix reported.

[0.01.000]: https://github.com/fsantibanezleal/CAOS_RES_Maqueta/releases/tag/v0.01.000
