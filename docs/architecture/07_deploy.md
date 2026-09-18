# 07, deploy and CI

## Deploy: a static site

What ships is `frontend/dist/`: the built single-page app plus a copy of `data/derived` (about 1.8 GB of
GLB). nginx serves it at <https://maqueta.ml.fasl-work.com>; a sample site config is in
[`deploy/`](../../deploy/). There is no backend.

1. Bake offline and commit the bundles ([05](05_precompute-pipeline.md)).
2. `cd frontend && npm ci && npm run build` (`copy-data.mjs` copies `data/derived` into `public/data`,
   then `tsc` and Vite build `dist/`).
3. Copy `dist/` to the web root. A change to the app alone can ship `index.html` and `assets/` without
   re-uploading `data/`.

The build uses root-absolute URLs (Vite `base: '/'`), so the site is served from the root of its domain.
That is what lets a deep link with a trailing slash, such as `/benchmark/`, load its script and data from
`/assets/` and `/data/` instead of from under the route.

GitHub Pages is not used: a published Pages site may be no larger than 1 GB, and the bundles alone exceed
that. The archetype's Pages workflow was removed, and `scripts/check_template_residue.py` fails the build
if it comes back.

## CI: `.github/workflows/ci.yml`

On every push to `main` or `develop` and on every pull request:

| Job | Step | Checks |
|---|---|---|
| `test` | Lint | `ruff check data-pipeline tests scripts` |
| `test` | Tests | `pytest`: the registry, the benchmark aggregation, `regen_index` and the CONTRACT 2 guard, each guard proven to fail on injected faults |
| `test` | Pipeline smoke | `python data-pipeline/run.py regen-index --check`: the committed index and benchmark reproduce from the bundles |
| `test` | CONTRACT 2 | `python scripts/check_artifacts.py` |
| `guards` | Base integrity | no tracked `.env`, virtual environment, native binary, raw data format or local machine path |
| `guards` | Template residue | `python scripts/check_template_residue.py` |
| `guards` | Content standards | `python scripts/check_content_standards.py` (no em-dash, no emoji) |
| `web` | SPA build | `npm ci`, `npm test` (vitest), `npm run build` (`tsc` + Vite) in `frontend/` |
