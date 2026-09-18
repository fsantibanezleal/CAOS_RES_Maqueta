# Guide 00, set up the environments

1. **Pipeline checks (Python 3.11 or newer; CI uses 3.12).** `./scripts/setup.sh` (or `scripts\setup.ps1`)
   creates `.venv-pipeline` with `data-pipeline/requirements.txt`, the dev tools and the editable
   `maquetalab` package. That is all the tests, the index regeneration and the guards need.
2. **Baking (optional).** Add the geoscena core with its fetch extras to `.venv-pipeline`, from the
   CAOS_GeoScena repository (the committed bundles use fetchers newer than its 0.1.0 release on PyPI), and
   the libraries `gen_admin` uses:

   ```bash
   .venv-pipeline/bin/python -m pip install -e "../CAOS_GeoScena[overture,osm]" geopandas requests shapely
   ```

   Downloads are cached under `$GEOSCENA_CACHE` (default `./.geoscena-cache`), outside git.
3. **Web app and compression tool (Node 20 or newer).** `cd frontend && npm ci` and, to compress bundles,
   `cd data-pipeline/tools && npm ci`. Each keeps its own `node_modules`; nothing is installed globally.

Next: [01, bake places](01_precompute-pipeline.md) or [04, the web app](04_web-app.md).
