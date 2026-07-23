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

- **`geoscena`** ([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena), on PyPI) is the
  reusable fusion/meshing core: it turns an Area of Interest into a `SceneBundle` (per-layer glTF + a
  provenance manifest) from open public sources.
- **`maquetalab`** (this repo, `data-pipeline/`) is the product pipeline: a 40-place registry, the bake
  wrapper, the orchestrator, and the cross-place benchmark.
- **`frontend/`** is the Three.js + shared-shell web app: a place-selector workbench with the 3D viewer,
  raycast building read-out, layer toggles, camera presets, plus the Introduction / Methodology /
  Implementation / Experiments / Benchmark pages and the in-app architecture modal (ADR-0058).

## Data modalities (all open, provenance-tracked)

Each scene fuses across modalities, every one carrying its source, license and fetch date:

- **Building footprints + roads**: Overture Maps (ODbL).
- **Terrain**: Copernicus GLO-30 DSM (Copernicus free).
- **Land cover**: ESA WorldCover 10 m (CC-BY-4.0).
- **Water / green / rail**: OpenStreetMap (ODbL).
- **Population density**: GHS-POP (CC-BY-4.0).
- **2.5D building heights**: Google Open Buildings Temporal (CC-BY-4.0), the Global-South rung of the
  height-provenance ladder where measured heights are sparse.
- **LoD2 ground truth** (adaptive, tier-A places): 3DBAG for the Netherlands (CC-BY-4.0), used both as a
  benchmark and as a renderable layer.

The roadmap adds more topic modalities (land use / zoning, vegetation, solar potential, climate, hazards)
per place where the public data exists; for the Chilean cases these come from the CC-BY geoportal.cl / IDE
Chile national layers.

## Places (target 40, tiered)

- **A - ground truth (~10):** open LoD2/lidar available (Amsterdam, Berlin, Manhattan, Tokyo, Helsinki...).
- **B - global-fusion cities (~22):** incl. Santiago, Valparaiso, Concepcion.
- **C - terrain-first areas (~8):** Chuquicamata, Atacama, Torres del Paine, Grand Canyon...

## Run it locally

```bash
# 1. bake places (the offline pipeline) into data/derived/
python -m venv .venv-pipeline && .\.venv-pipeline\Scripts\pip install -e . "geoscena[overture,osm]"
python -m maquetalab.pipeline berlin_mitte --fetched 2026-07-12   # one place
python -m maquetalab.pipeline --fetched 2026-07-12                # all 40

# 2. run the web app (replays the baked bundles)
cd frontend && npm install && npm run dev
```

Raw source downloads live on an out-of-git data volume (set `GEOSCENA_CACHE`); only the compact baked
bundles are committed.

## Deploy

Maqueta is a static site: bake the bundles offline, `npm run build` the frontend, and serve the
resulting `dist/` from any static host (nginx or a CDN). The live instance runs at
**[maqueta.ml.fasl-work.com](https://maqueta.ml.fasl-work.com)**. See [`deploy/`](deploy/) for a sample
nginx config.

## Status

`0.x` while the place set and API stabilize. See [`docs/`](docs/) for the wiki.

Owner: Felipe Santibanez-Leal · fsantibanez@gmail.com · [@fsantibanezleal](https://github.com/fsantibanezleal)
