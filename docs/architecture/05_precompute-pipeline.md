# 05, the bake pipeline

`python -m maquetalab.pipeline` (`data-pipeline/maquetalab/pipeline.py`) runs these steps in order; each
step's output is a committed file the next one, or the web app, reads.

| Step | Code | Reads | Writes |
|---|---|---|---|
| 1. Select | `places.py` | the registry | one place, one tier (`--tier`) or all 118 |
| 2. Bake | `build.bake_place`, calling `geoscena.build.build_scene` | the open sources, `--fetched`, the environment switches | `data/derived/<slug>/*.glb` + `manifest.json` |
| 3. Compress | `pipeline.compress_bundles`, running `tools/compress-bundles.mjs` | every `.glb` under `data/derived` | the same files with `EXT_meshopt_compression` + `KHR_mesh_quantization` |
| 4. Index | `pipeline.reindex`, calling `regen_index.write` | every bundle on disk + the registry | `index.json`, `benchmark.json` |
| 5. Sub-areas | `python -m maquetalab.gen_admin` (run separately) | manifests with a `buildings` layer, geoBoundaries, the environment APIs, the Data Observatory mirror | `data/derived/<slug>/admin.json` |

## Step 2 in detail

`bake_place` builds the area of interest from the place centre and half-size and a `BuildConfig`:

- **Terrain mesh budget**: tier C places (terrain-first) allow a 3.0 m vertical error and 9,000 vertices;
  tiers A and B allow 1.2 m and 6,000 vertices.
- **What is fetched**: tier C skips buildings and roads; `MAQUETA_NO_ROADS=1` skips roads and
  `MAQUETA_NO_CONTEXT=1` skips the OpenStreetMap water / green / rail context everywhere.
- **Height ladder** (in geoscena, per building): a mapped height attribute (`measured`), else the floor
  count times a storey height (`floors`), else the Google Open Buildings 2.5D height raster where it covers
  the place (`raster`; the manifest note says "open-buildings 2.5D raster used"), else a default (`prior`).
  The rung is stored on the building and summed into `stats.height_mix`.
- **Writing**: once the new bundle exists, the place's previous `.glb` layers are deleted and the new ones
  written, so a re-bake with fewer layers leaves no stale file behind (`admin.json` is kept). If the fetch
  or build fails, the place is reported, skipped, and its previous bundle stays.

## Steps 3 and 4

Compression is lossless for topology and keeps the `_featureid` picking attribute and the per-building
extras. The index is written after compression, from what is on disk, so its byte sizes are the shipped
ones and a one-place bake keeps every other place in the index. `--compress-only` recompresses and
reindexes without baking.

## Checks after a bake

```bash
python -m maquetalab.regen_index --check   # index + benchmark reproduce from the bundles
python scripts/check_artifacts.py          # CONTRACT 2 in both directions
pytest                                     # includes: the registry and the index name the same places
```

These are the checks CI runs ([07](07_deploy.md)); the guide is
[guides/01_precompute-pipeline.md](../guides/01_precompute-pipeline.md).
