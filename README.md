# Maqueta

[![License](https://img.shields.io/github/license/fsantibanezleal/CAOS_RES_Maqueta)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-maqueta.ml.fasl--work.com-2ea44f)](https://maqueta.ml.fasl-work.com)

**3D visualization + reconstruction of real-world areas from fused open public geodata.** Maqueta bakes
each curated place (cities, mining districts, natural areas) into a static, versioned 3D scene by fusing
building footprints + heights, terrain, land cover, roads, water and green areas, and renders them with a
shader-art identity (Fresnel rim, neon roads, bloom, orbital camera). Unlike a single-city extrusion, every
building carries an honest **height provenance** (measured vs inferred), and scenes are benchmarked against
authoritative LoD2 models where they exist.

## Architecture

- **`geoscena`** ([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena), on PyPI) is the
  reusable fusion/meshing core: it turns an Area of Interest into a `SceneBundle` (per-layer glTF + a
  provenance manifest) from open public sources.
- **`maquetalab`** (this repo, `data-pipeline/`) is the product pipeline: a 40-place registry, the bake
  wrapper, the orchestrator, and the cross-place benchmark.
- **`frontend/`** is the Three.js + shared-shell web app: a place-selector workbench with the 3D viewer,
  raycast building read-out, layer toggles, camera presets, plus the Introduction / Methodology /
  Implementation / Experiments / Benchmark pages and the in-app architecture modal (ADR-0058).

## Data sources (all open, provenance-tracked)

Overture Maps buildings + roads (ODbL), Copernicus GLO-30 terrain (Copernicus free), ESA WorldCover 10 m
(CC-BY-4.0), OpenStreetMap water/green/rail (ODbL); the height-provenance ladder additionally samples
Google Open Buildings 2.5D height rasters (Global South) where measured heights are sparse.

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
