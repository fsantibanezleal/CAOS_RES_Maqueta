# data/ - the data contract + layout

Maqueta follows the two data contracts of ADR-0057, realized by the `geoscena` core.

## Layout

| Path | What | Git |
|---|---|---|
| `raw/` | source downloads + intermediates (COG tiles, GeoParquet, LAZ) | **git-ignored**; lives on `E:\_Datos\maqueta` |
| `derived/<slug>/` | the baked SceneBundle: `terrain.glb`, `buildings.glb`, `roads.glb`, ... + `manifest.json` | committed (compact) |
| `derived/index.json` | the place index the web reads first (slug, name, tier, size) | committed |
| `derived/benchmark.json` | the cross-place summary (height-provenance mix, budgets) | committed |

## Contract 1 - ingestion (source -> pipeline)

Each `geoscena` fetcher returns geometry/raster PLUS a `LayerProvenance` (source, URL, license key,
fetch date, method). No layer enters a bundle without provenance. Sources + licenses:

| Layer | Source | License | Commercial OK |
|---|---|---|---|
| buildings, roads | Overture Maps (via `overturemaps` CLI) | ODbL-1.0 | yes |
| terrain | Copernicus GLO-30 DSM (AWS Open Data) | Copernicus free | yes |
| land cover | ESA WorldCover 10 m (AWS Open Data) | CC-BY-4.0 | yes |
| water, green, rail | OpenStreetMap (Overpass via OSMnx) | ODbL-1.0 | yes |
| building heights (fallback) | Google Open Buildings 2.5D | CC-BY-4.0 + ODbL | yes |

## Contract 2 - artifact (pipeline -> web)

The `manifest.json` per place (`geoscena.bundle.SceneBundle.to_manifest`): schema version, AOI (bbox,
local origin, size), per-layer file + stats + provenance, the height-provenance mix, a credits list, and
an `any_noncommercial` flag. A TypeScript type in `frontend/src/lib/contract.types.ts` mirrors it, so a
drift fails the web build.

## Height provenance

Every building's height is tagged with the rung it came from: `measured` (Overture/OSM), `floors`
(num_floors x floor height), `raster` (Open Buildings 2.5D), or `prior` (default). The mix is baked per
place and aggregated globally, and shown in the App read-out and the Benchmark page. Measured and inferred
heights are never conflated.
