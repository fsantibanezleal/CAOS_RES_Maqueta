# Maqueta

[![License](https://img.shields.io/github/license/fsantibanezleal/CAOS_RES_Maqueta)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-maqueta.ml.fasl--work.com-2ea44f)](https://maqueta.ml.fasl-work.com)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21519794-blue)](https://doi.org/10.5281/zenodo.21519794)

**A multi-modal geospatial fusion tool: 3D visualization + reconstruction of real-world areas from open
public geodata, using the height map as the entry point.** Maqueta bakes each curated place (cities, mining
districts, natural areas) into a static, versioned 3D scene by fusing many data modalities: building
footprints + heights, terrain, land cover, roads, water and green areas, population density, 2.5D building
heights and (adaptive per place) authoritative LoD2 ground truth. The height map is the 3D scaffold the
other modalities register onto. The web app renders it as an interactive workbench (toggleable source
layers, per-attribute filtering and colouring, click-to-select) with a shader-art identity (Fresnel rim,
neon roads, bloom, orbital camera). Unlike a single-source extrusion, every building carries an honest
**height provenance** (measured vs inferred), and scenes are benchmarked against authoritative LoD2 models
where they exist.

## Architecture

- **`geoscena`** ([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena)) is the reusable
  fusion/meshing core: it turns an Area of Interest into a `SceneBundle` (per-layer glTF + a provenance
  manifest) from open public sources. Release 0.1.0 is on PyPI; the committed bundles were baked with newer
  source from the repository.
- **`maquetalab`** (this repo, `data-pipeline/`) is the product pipeline: the 118-place registry, the bake
  wrapper, the orchestrator, the place index, the cross-place benchmark and the admin sub-areas.
- **`frontend/`** is the Three.js + shared-shell web app: a place-selector workbench with the 3D viewer,
  raycast building read-out, layer toggles, camera presets, plus the Introduction / Methodology /
  Implementation / Experiments / Benchmark pages and the in-app architecture modal (ADR-0058).

## Data modalities (all open, provenance-tracked)

Each scene fuses across modalities; every layer's source, license and fetch date is recorded in the bundle
manifest ([docs/architecture/08](docs/architecture/08_data-contracts.md) lists what the 118 manifests hold):

- **Building footprints + roads**: Overture Maps (ODbL).
- **Terrain**: Copernicus GLO-30 DSM (Copernicus free).
- **Land cover**: ESA WorldCover 10 m class per building (CC-BY-4.0); the one attribute whose provenance
  the manifests do not record yet.
- **Water / green / rail**: OpenStreetMap (ODbL).
- **Population density**: GHS-POP (CC-BY-4.0).
- **2.5D building heights**: Google Open Buildings Temporal (CC-BY-4.0), the Global-South rung of the
  height-provenance ladder where measured heights are sparse.
- **LoD2 ground truth** (adaptive, tier-A places): 3DBAG for the Netherlands (CC-BY-4.0), used both as a
  benchmark and as a renderable layer.
- **Satellite indices** per building: NDVI / NDWI / NDBI from one Sentinel-2 L2A scene per place.
- **Soil organic carbon** per building: ISRIC SoilGrids 2.0 (CC-BY-4.0), where it covers the place.
- **Solar and climate** per place and per sub-area: PVGIS v5.3 and Open-Meteo ERA5 (2023).

Further topic modalities (land use / zoning, hazards, the Chilean IDE national layers) are on the roadmap
where open data exists.

## Places (118, tiered)

- **A - ground truth (10):** open LoD2/lidar available (Berlin, Amsterdam, Delft, Manhattan, Tokyo...);
  Delft and Amsterdam are benchmarked against 3D BAG LoD2.
- **B - global-fusion cities (90):** the 37 Gran Santiago comunas, 12 metro cores (Santiago and 11 world
  cities) and 41 more cities worldwide.
- **C - terrain-first areas (18):** Chuquicamata, Valle de la Luna (Atacama), Torres del Paine, Grand
  Canyon, Mount Fuji...

Details: [docs/cases/README.md](docs/cases/README.md).

## Run it locally

```bash
# 1. environments (baking also needs the geoscena source, see docs/guides/00_setup.md)
./scripts/setup.sh                                            # or scripts/setup.ps1
# 2. bake places (the offline pipeline) into data/derived/
./scripts/precompute.sh berlin_mitte --fetched 2026-07-12     # one place
./scripts/precompute.sh --fetched 2026-07-12                  # all 118
./scripts/smoke.sh                                            # the data checks CI runs
# 3. run the web app (replays the baked bundles)
cd frontend && npm ci && npm run dev
```

Raw source downloads live in the geoscena fetch cache outside git (set `GEOSCENA_CACHE`); only the compact
baked bundles are committed.

## Deploy

Maqueta is a static site: bake the bundles offline, `npm run build` the frontend, and serve the resulting
`dist/` (about 1.8 GB with the bundles) from the root of a domain on any static host with a single-page-app
fallback. The live instance runs at **[maqueta.ml.fasl-work.com](https://maqueta.ml.fasl-work.com)**. See
[`deploy/`](deploy/) for a sample nginx config and [docs/guides/04_web-app.md](docs/guides/04_web-app.md).

## Status

`0.x` while the place set and API stabilize. See [`docs/`](docs/) for the wiki.

Owner: Felipe Santibanez-Leal · fsantibanez@gmail.com · [@fsantibanezleal](https://github.com/fsantibanezleal)
