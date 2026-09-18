# 08, the two data contracts

## CONTRACT 1, sources to pipeline: nothing enters a bundle without provenance

Every layer geoscena writes carries a `LayerProvenance`: `source`, `url`, `license` (key), `license_name`,
`license_url`, `commercial_ok`, `fetched` (the `--fetched` date), `method` and source-specific `extra`.
Per-building attributes that do not form a layer are listed under the manifest's `modalities` with their
own source and license, and the per-place environment block lists its `sources`.

What the 118 committed manifests record:

| Layer or attribute | Source | License (as recorded) | Places |
|---|---|---|---:|
| `terrain` | Copernicus GLO-30 DSM | Copernicus-free | 118 |
| `buildings` (+ `buildings_lite` proxy at 25 large places) | Overture Maps buildings, release 2026-06-17.0 | ODbL-1.0 | 100 |
| `roads` | Overture Maps transportation | ODbL-1.0 | 100 |
| `population` | GHS-POP R2023A (JRC), OpenLandMap COG mirror | CC-BY-4.0 | 116 |
| `water` / `green` / `rail` | OpenStreetMap through OSMnx | ODbL-1.0 | 24 / 26 / 23 |
| `lod2` | 3D BAG LoD2 (TU Delft) | CC-BY-4.0 | 2 |
| per building: `ndvi`, `ndwi`, `ndbi` | one Sentinel-2 L2A scene per place (id and date recorded) | `proprietary` | 100 |
| per building: `soil_soc` | ISRIC SoilGrids 2.0 | CC-BY-4.0 | 71 |
| per place: environment | PVGIS v5.3; Open-Meteo ERA5 archive (2023) | `proprietary`; cc-by-4.0 | 118 |

The Sentinel-2 and PVGIS license keys are recorded as `proprietary`; the terms that apply are described in
[09](09_analytical-layers.md). No manifest flags a non-commercial layer (`any_noncommercial` is false at
all 118 places).

**Known gaps.**

- Every baked building also carries a land-cover class (`class`, ESA WorldCover class codes, non-null on all
  4,053,338 buildings), which the app offers as the "Land cover" colour and mix. No manifest records a
  provenance entry for it: it is neither a layer nor a listed modality. Until geoscena records it, this
  attribute is the exception to the rule above.
- No bundle carries the per-building solar modality (`solar_ghi`), although the app would offer it:
  geoscena reads it from a local Global Solar Atlas GHI GeoTIFF (`{cache}/solar/GHI.tif`), nothing in
  geoscena or here downloads that file, and `build.py` passes no cache folder (`BuildConfig.cache_dir` is left
  unset), so every building place recorded `modality solar_ghi skipped: FileNotFoundError`. Baking it needs
  the GeoTIFF placed in a cache folder, `cache_dir` passed to the build, and a re-bake of the building places.
  Solar potential is present per place instead, from PVGIS ([09](09_analytical-layers.md)).

## CONTRACT 2, pipeline to web: what the app reads

| File | Written by | Read by the app for |
|---|---|---|
| `data/derived/index.json` | `regen_index` | the place picker: slug, names, tier, hierarchy, layer count, bytes |
| `data/derived/<slug>/manifest.json` | geoscena (`SceneBundle.to_manifest`) | the layers to load, provenance, credits, environment |
| `data/derived/<slug>/*.glb` | geoscena, then meshopt compression | the geometry and the per-building attributes |
| `data/derived/<slug>/admin.json` | `gen_admin` (68 places) | sub-area polygons, environment and indicators per unit |
| `data/derived/benchmark.json` | `regen_index` (via `benchmark.py`) | the Benchmark page |

**Enforcement.**

- `frontend/src/lib/contract.types.ts` mirrors these shapes, so a field the app uses cannot silently
  disappear without failing `tsc`.
- `scripts/check_artifacts.py` (CI) checks the files agree in both directions: every indexed place has a
  manifest, every named layer exists and is a glTF 2.0 binary whose header length equals its size, every
  layer has a source, license and fetch date, index byte counts and layer counts match the files, no file
  in a place folder goes unnamed, and the benchmark rows match the index.
- `python data-pipeline/run.py regen-index --check` (CI) proves the index and benchmark are exactly what the
  pipeline derives from the bundles.
