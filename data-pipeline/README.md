# data-pipeline/, the offline bake

Everything that turns open public geodata into the committed SceneBundles runs here, offline, on the
maintainer's machine; the web app only replays what this produces. The fetching, per-building fusion and
meshing are done by the `geoscena` core ([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena)).

This is plain code, not a package (conventions/no-internal-packages.md): nothing here is installed, and the
only way in is `run.py`, invoked by path, which puts this folder on `sys.path` and runs one command from the
`pipeline/` folder. Up to release 0.08.000 this code was an installed internal package named `maquetalab`.

## Modules

| Module | Role |
|---|---|
| `run.py` | The entry point: `bake`, `regen-index` or `gen-admin`, each imported only when it runs. |
| `pipeline/places.py` | The place registry: slug, centre, half-size, tier (A ground truth, B global-fusion city, C terrain-first), continent / country / city and a note per place. |
| `pipeline/build.py` | `bake_place`: builds the area of interest and the `BuildConfig`, runs `geoscena.build.build_scene`, removes the place's previous `.glb` layers and writes `data/derived/<slug>/`. |
| `pipeline/pipeline.py` | The `bake` command: bake one place, one tier or all; meshopt-compress; regenerate the index. |
| `pipeline/regen_index.py` | The `regen-index` command and the single writer of `index.json` + `benchmark.json`, from the bundles on disk. `--output DIR` writes elsewhere; `--check` compares with the committed files and writes nothing (the CI smoke). |
| `pipeline/benchmark.py` | The cross-place summary behind the Benchmark page. |
| `pipeline/gen_admin.py` | The `gen-admin` command: `admin.json` for every place with buildings, geoBoundaries units at the finest level (ADM4 to ADM1) with 2 to 40 units in the area, each with its environment values and, in Chile, its Data Observatory indicators. |
| `pipeline/do_indicators.py` | Chilean comuna indicators (health facilities, foreign-born residents, schools) from the Data Observatory mirror, for `gen_admin`. |
| `tools/compress-bundles.mjs` | `EXT_meshopt_compression` over every `.glb` in place (gltf-transform + meshoptimizer). |

## Run

```bash
python data-pipeline/run.py bake --fetched 2026-07-12                   # bake all places, compress, reindex
python data-pipeline/run.py bake berlin_mitte --fetched 2026-07-12      # one place; the index keeps the rest
python data-pipeline/run.py bake --tier A --fetched 2026-07-12          # one tier
python data-pipeline/run.py bake --compress-only --fetched 2026-07-12   # recompress existing bundles, reindex
python data-pipeline/run.py gen-admin                                   # admin.json sub-areas, after a bake
python data-pipeline/run.py regen-index                                 # rewrite index.json + benchmark.json
python data-pipeline/run.py regen-index --check                         # verify them; writes nothing
```

`--fetched` is the date recorded as every layer's fetch date. Two switches are read by `build.py`:
`MAQUETA_NO_CONTEXT=1` skips the OpenStreetMap water / green / rail fetch (the public Overpass queue can
take minutes) and `MAQUETA_NO_ROADS=1` skips the Overture transportation scan. A place that fails to bake
is reported and skipped; its previous bundle stays in place.

## Dependencies

CI installs `requirements.txt` in this folder (numpy) and `../requirements-dev.txt` (pytest, ruff): enough
for the tests, the index regeneration and the guards, none of which touch the network.

A bake, and `gen_admin`, also need the geoscena core with its fetch extras: `requirements-bake.txt` in this
folder pins it to CAOS_GeoScena commit `ab0bbf8` (2026-07-14), and geopandas, requests and shapely come with
it. That commit, not the 0.1.0 release on PyPI, is what the committed bundles match: PyPI 0.1.0 predates the
population, Open Buildings 2.5D, LoD2, Sentinel-2, soil and environment fetchers, and the git install reports
the same `0.1.0` distribution version (its code says `__version__ = "0.05.000"`), so the version number
alone cannot tell the two apart. How the commit was identified: all 118 manifests carry the notes that only
`build.py` at `ab0bbf8` writes (the `environment:` note first appears there) and none from later commits,
and they were committed on 2026-07-14 between `ab0bbf8` and the next CAOS_GeoScena commit (2026-07-18). The
manifests do not record the geoscena version, so uncommitted local edits at bake time cannot be ruled out.
When a CAOS_GeoScena checkout sits next to this repository, `gen_admin` prefers its `src/`. Raw downloads are
cached outside git under `$GEOSCENA_CACHE` (default `./.geoscena-cache`).

More: [docs/architecture/05_precompute-pipeline.md](../docs/architecture/05_precompute-pipeline.md) and
[docs/guides/01_precompute-pipeline.md](../docs/guides/01_precompute-pipeline.md).
