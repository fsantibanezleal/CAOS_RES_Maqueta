# data-pipeline/, the offline bake (`maquetalab`)

Everything that turns open public geodata into the committed SceneBundles runs here, offline, on the
maintainer's machine; the web app only replays what this produces. `maquetalab` is the product-side
pipeline. The fetching, per-building fusion and meshing are done by the `geoscena` core
([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena)).

## Modules

| Module | Role |
|---|---|
| `maquetalab/places.py` | The place registry: slug, centre, half-size, tier (A ground truth, B global-fusion city, C terrain-first), continent / country / city and a note per place. |
| `maquetalab/build.py` | `bake_place`: builds the area of interest and the `BuildConfig`, runs `geoscena.build.build_scene`, removes the place's previous `.glb` layers and writes `data/derived/<slug>/`. |
| `maquetalab/pipeline.py` | CLI and orchestrator: bake one place, one tier or all; meshopt-compress; regenerate the index. |
| `maquetalab/regen_index.py` | The single writer of `index.json` + `benchmark.json`, from the bundles on disk. `--output DIR` writes elsewhere; `--check` compares with the committed files and writes nothing (the CI smoke). |
| `maquetalab/benchmark.py` | The cross-place summary behind the Benchmark page. |
| `maquetalab/gen_admin.py` | `admin.json` for every place with buildings: geoBoundaries units at the finest level (ADM4 to ADM1) with 2 to 40 units in the area, each with its environment values and, in Chile, its Data Observatory indicators. |
| `maquetalab/do_indicators.py` | Chilean comuna indicators (health facilities, foreign-born residents, schools) from the Data Observatory mirror, for `gen_admin`. |
| `tools/compress-bundles.mjs` | `EXT_meshopt_compression` over every `.glb` in place (gltf-transform + meshoptimizer). |

## Run

```bash
python -m maquetalab.pipeline --fetched 2026-07-12                # bake all places, compress, reindex
python -m maquetalab.pipeline berlin_mitte --fetched 2026-07-12   # one place; the index keeps the rest
python -m maquetalab.pipeline --tier A --fetched 2026-07-12       # one tier
python -m maquetalab.pipeline --compress-only --fetched 2026-07-12   # recompress existing bundles, reindex
python -m maquetalab.gen_admin                                    # admin.json sub-areas, after a bake
python -m maquetalab.regen_index                                  # rewrite index.json + benchmark.json only
python -m maquetalab.regen_index --check                          # verify them; writes nothing
```

`--fetched` is the date recorded as every layer's fetch date. Two switches are read by `build.py`:
`MAQUETA_NO_CONTEXT=1` skips the OpenStreetMap water / green / rail fetch (the public Overpass queue can
take minutes) and `MAQUETA_NO_ROADS=1` skips the Overture transportation scan. A place that fails to bake
is reported and skipped; its previous bundle stays in place.

## Dependencies

CI installs `requirements.txt` in this folder (numpy) and `../requirements-dev.txt` (pytest, ruff): enough
for the tests, the index regeneration and the guards, none of which touch the network.

A bake also needs the geoscena core with its fetch extras, and `gen_admin` needs geopandas, requests and
shapely. These are not pinned here yet: the committed bundles were baked with geoscena source newer than
its 0.1.0 release on PyPI, which has no population, Open Buildings, LoD2, Sentinel-2 or environment
fetchers. Install geoscena from the CAOS_GeoScena repository into `.venv-pipeline`, for example
`pip install -e "../CAOS_GeoScena[overture,osm]"`. Raw downloads are cached outside git under
`$GEOSCENA_CACHE` (default `./.geoscena-cache`).

More: [docs/architecture/05_precompute-pipeline.md](../docs/architecture/05_precompute-pipeline.md) and
[docs/guides/01_precompute-pipeline.md](../docs/guides/01_precompute-pipeline.md).
