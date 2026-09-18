# Guide 00, set up the environments

1. **Pipeline checks (Python 3.11 or newer; CI uses 3.12).** `./scripts/setup.sh` (or `scripts\setup.ps1`)
   creates `.venv-pipeline` with `data-pipeline/requirements.txt` and the dev tools. That is all the tests,
   the index regeneration and the guards need; the pipeline code itself is never installed, it runs by path
   (`python data-pipeline/run.py ...`).
2. **Baking (optional).** Add the bake lane to `.venv-pipeline`: the geoscena core with its fetch extras,
   pinned to the CAOS_GeoScena commit the committed bundles match (`ab0bbf8`; its 0.1.0 release on PyPI
   predates most of the fetchers), which also brings the libraries `gen_admin` uses:

   ```bash
   .venv-pipeline/bin/python -m pip install -r data-pipeline/requirements-bake.txt
   ```

   Downloads are cached under `$GEOSCENA_CACHE` (default `./.geoscena-cache`), outside git.
3. **Web app and compression tool (Node 20 or newer).** `cd frontend && npm ci` and, to compress bundles,
   `cd data-pipeline/tools && npm ci`. Each keeps its own `node_modules`; nothing is installed globally.

Next: [01, bake places](01_precompute-pipeline.md) or [04, the web app](04_web-app.md).
