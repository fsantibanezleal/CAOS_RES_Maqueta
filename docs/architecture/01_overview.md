# 01, overview

Maqueta reconstructs real places in 3D from open public geodata and keeps, for every building, the record
of where its height came from. It has three parts.

| Part | Where | What it does |
|---|---|---|
| Fusion core | `geoscena` ([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena)) | For one area of interest: fetch each source, fuse the per-building attributes (including the height-provenance ladder), mesh terrain, buildings and roads, and write a SceneBundle (one `.glb` per layer plus a provenance manifest). |
| Bake pipeline | `data-pipeline/maquetalab` | The place registry (118 places), the bake orchestration, meshopt compression, the place index and benchmark, and the admin sub-areas. Runs offline on the maintainer's machine. |
| Web app | `frontend/` | A React + Three.js single-page app on the shared `@fasl-work/caos-app-shell`. It reads the committed bundles and renders them; all analysis in the browser works on baked attributes. |

## A place's path from sources to screen

1. `places.py` defines the place: centre, half-size, tier, and where it sits in the continent / country /
   city hierarchy.
2. `build.py` calls `geoscena.build.build_scene`, which fetches the layers the manifest then records
   (Copernicus GLO-30 terrain, Overture buildings and roads, GHS-POP population, OpenStreetMap water /
   green / rail, 3D BAG LoD2 where it exists), attaches the per-building attributes (height and its rung,
   land-cover class, Sentinel-2 NDVI / NDWI / NDBI, soil organic carbon where SoilGrids covers the place)
   and the per-place environment block (PVGIS solar, Open-Meteo climate), and writes
   `data/derived/<slug>/`.
3. `tools/compress-bundles.mjs` applies `EXT_meshopt_compression` to every `.glb`.
4. `regen_index.py` writes `index.json` (the place list the app loads first) and `benchmark.json` (the
   Benchmark page) from the bundles on disk.
5. `gen_admin.py` writes `admin.json` (geoBoundaries sub-areas with environment values and, in Chile,
   Data Observatory indicators) for the places that have buildings: 68 of them today.
6. `frontend/copy-data.mjs` copies `data/derived` into the build, and the static site serves it.

The browser never fetches or recomputes the geodata; [03](03_the-gate.md) explains why and
[04](04_live-lane-pyodide.md) lists what it does compute. The one request to a third party at run time is
the optional satellite drape (EOX Sentinel-2 cloudless WMS), made only when the viewer turns it on.

## Archetype lanes in this product

| Lane | Status |
|---|---|
| Offline bake | Active: `data-pipeline/`, local only (network fetches, GDAL-backed raster reads, meshing). |
| Replay (static web) | Active: `frontend/`, the only thing deployed. |
| Live recompute in the browser (Pyodide) | Not used, see [03](03_the-gate.md). |
| API backend (`app/`) | Dormant archetype scaffold, not used. |
