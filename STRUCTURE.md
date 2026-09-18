# Repository structure

What each part of this repository is for, as it exists today. Maqueta was instantiated from the CAOS
product-repo archetype (ADR-0057); the folders the archetype provides but this product does not use are
listed at the end.

## How the parts fit

The offline pipeline (`data-pipeline/maquetalab`, over the `geoscena` fusion core) bakes each registered
place into a SceneBundle under `data/derived/<slug>/`: one `.glb` per layer plus a `manifest.json` that
records every layer's source, license and fetch date. `regen_index` summarises the bundles into
`data/derived/index.json` and `data/derived/benchmark.json`, and `gen_admin` adds `admin.json` sub-areas.
The web app in `frontend/` only reads those committed files; it never fetches or recomputes the geodata.
Details: [docs/architecture/01_overview.md](docs/architecture/01_overview.md).

## Tree

```
CAOS_RES_Maqueta/
├─ README.md · CHANGELOG.md · LICENSE (MIT) · STRUCTURE.md · CONTRIBUTING.md · CODE_OF_CONDUCT.md · SECURITY.md
├─ pyproject.toml                 the maquetalab pipeline package (installed editable for tests and CI)
├─ requirements.txt · requirements-dev.txt · requirements-api.txt
├─ data-pipeline/
│  ├─ maquetalab/
│  │  ├─ places.py                the place registry: 118 areas of interest, tier, hierarchy, notes
│  │  ├─ build.py                 bake one place with geoscena and write its bundle
│  │  ├─ pipeline.py              CLI: bake, meshopt-compress, regenerate the index
│  │  ├─ regen_index.py           the single writer of index.json + benchmark.json (and --check)
│  │  ├─ benchmark.py             cross-place summary: height-provenance mix, budgets, LoD2 rows
│  │  ├─ gen_admin.py             admin.json per place: geoBoundaries units + environment + indicators
│  │  └─ do_indicators.py         Chilean Data Observatory comuna indicators for gen_admin
│  ├─ tools/compress-bundles.mjs  EXT_meshopt_compression for every baked .glb (gltf-transform)
│  └─ requirements.txt            the pipeline lane CI installs
├─ data/
│  ├─ README.md                   the two data contracts and the height-provenance rungs
│  └─ derived/                    committed bundles: <slug>/{*.glb, manifest.json, admin.json},
│                                 index.json, benchmark.json
├─ frontend/                      React + Three.js SPA on @fasl-work/caos-app-shell
│  ├─ copy-data.mjs               overlays data/derived into the build (public/data)
│  └─ src/  lib/contract.types.ts (CONTRACT 2 mirror) · lib/data.ts (loaders) · render/ (scene, viewer)
│           pages/ (App, Introduction, Methodology, Implementation, Experiments, Benchmark)
│           architecture.ts (the in-app architecture modal)
├─ tests/                         pytest: registry, benchmark, regen_index, the CONTRACT 2 guard
├─ scripts/                       setup / precompute / smoke / dev (.sh + .ps1) and the three CI guards
├─ docs/                          the wiki: architecture, cases, frameworks, guides
├─ deploy/                        sample nginx site for the static deploy; dormant backend templates
├─ manuscripts/                   the published technical report (LaTeX source, figures, data)
└─ .github/workflows/ci.yml       lint, tests, pipeline smoke, CONTRACT 2, guards, SPA build
```

## Dependencies by lane

| File | Lane | Holds |
|---|---|---|
| `data-pipeline/requirements.txt` + `requirements-dev.txt` | pipeline checks (CI, `.venv-pipeline`) | numpy, pytest, ruff: the tests, the index regeneration and the guards, none of which touch the network |
| `data-pipeline/requirements-bake.txt` | baking, `gen_admin` | the geoscena core with its fetch extras, pinned to the CAOS_GeoScena commit the bundles match (`ab0bbf8`); geopandas / requests / shapely come with it; see [data-pipeline/README.md](data-pipeline/README.md) |
| `frontend/package-lock.json` | web app | exact versions of three, react, the shared shell, vite, typescript |
| `data-pipeline/tools/package-lock.json` | bundle compression | gltf-transform and meshoptimizer |
| `requirements.txt` | archetype runtime lane (`.venv`) | numpy; Maqueta runs no Python at request time |
| `requirements-api.txt` | dormant `app/` backend | nothing (placeholder) |

## Archetype parts this product does not use

- `app/`, `requirements-api.txt`, `deploy/domain.nginx`, `deploy/fasl-slug.service`: the archetype's
  optional FastAPI backend, dormant. Its endpoints follow the archetype's case layout, not Maqueta's
  bundles, so it would need adapting before any activation.
- Empty scaffold folders kept by `.gitkeep`: `data/{artifacts,demo,examples,samples}`, `manifests/`,
  `models/`, `data-pipeline/{cases,config,src,stages}`.
