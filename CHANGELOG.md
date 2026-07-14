# Changelog

All notable changes to Maqueta. Format: [Keep a Changelog](https://keepachangelog.com/); versions use
`X.XX.XXX` (display). `0.x` while the place set and API stabilize. Tag every release.

## [0.07.000] - 2026-07-13

### Added
- **29 new places (107 total).** Chile: Calama, Antofagasta, Sierra Gorda, Valdivia, Chiloe (Castro).
  World metros: Shanghai, Beijing, Hong Kong, Delhi, Bangkok, Jakarta, Dubai, Los Angeles, Chicago, Lagos.
  Iconic landmarks + landscapes: Giza Pyramids, Machu Picchu, Taj Mahal (Agra), Great Wall, Petra, Angkor
  Wat, Mount Fuji, Rio de Janeiro, Venice, Matterhorn, Yosemite, Victoria Falls, Santorini, Monument Valley.
- **Searchable place picker.** Replaces the native select (unusable at 100+ places): type to filter by
  city / country / landmark, results grouped by continent with sticky headers.

### Changed
- **Cinematic default view.** The app opens on a low oblique that fills the frame with the built fabric and
  lets it recede to the far relief hazing into the sky.
- **Terrain rendering overhaul** (fixes terrain-first places rendering off-screen and as a transparent/grey
  surface): frame at the terrain's true altitude so high places (Atacama, Chuquicamata ~2500 m) are in
  view; render the terrain DoubleSide with flipped normals (the baked TIN winding was inverted, back-face-
  culling the flat surface); bake a hillshade + earthy hypsometric ramp with altitude-gated snow caps into
  the vertex colours (lighting-independent). Terrain-first places now read as solid coloured 3D landscapes;
  cities sit on visible coloured ground with the Andes as earthy relief.

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
- Instantiated from the CAOS product-repo template (ADR-0057); package renamed `examplelab` -> `maquetalab`.
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
