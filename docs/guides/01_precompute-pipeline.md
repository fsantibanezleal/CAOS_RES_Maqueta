# Guide 01, bake places (the offline pipeline)

Needs the baking setup from [guide 00](00_setup.md), step 2.

```bash
./scripts/precompute.sh berlin_mitte --fetched 2026-09-18    # one place
./scripts/precompute.sh --tier C --fetched 2026-09-18        # one tier
./scripts/precompute.sh --fetched 2026-09-18                 # all 118 places (hours)
MAQUETA_NO_CONTEXT=1 ./scripts/precompute.sh ...             # skip the OpenStreetMap context layers
```

Each run bakes the selected places into `data/derived/<slug>/`, compresses every `.glb` with meshopt (skipped
with a warning when `data-pipeline/tools/node_modules` is missing, or with `--no-compress`), and then
rewrites `index.json` and `benchmark.json` from every bundle on disk. A place that fails is reported and keeps
its previous bundle.

Then, for places with buildings, refresh the sub-areas (it walks every place and needs network access for
geoBoundaries and the environment APIs):

```bash
.venv-pipeline/bin/python data-pipeline/run.py gen-admin
```

Check and commit:

```bash
./scripts/smoke.sh                      # regen_index --check + CONTRACT 2
.venv-pipeline/bin/python -m pytest     # Scripts/python.exe on Windows
git add data/derived                    # the changed bundles, index.json, benchmark.json, admin.json
```

Read the new `manifest.json` notes before committing: they list every source that was skipped or failed.
The pipeline steps are described in [architecture/05](../architecture/05_precompute-pipeline.md).
