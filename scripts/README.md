# scripts/, environment setup, pipeline runs and the CI guards

Every script exists as `*.sh` (macOS / Linux / Git Bash) and `*.ps1` (Windows PowerShell). They are
idempotent and use only the repository's own virtual environments, never a global Python or Node.

| Script | What it does |
|---|---|
| `setup.sh` / `setup.ps1` | Creates `.venv-pipeline` (pipeline lane, dev tools and the editable `maquetalab` package) and `.venv` (the archetype's runtime lane). Baking also needs the geoscena core, see [data-pipeline/README.md](../data-pipeline/README.md). |
| `precompute.sh` / `precompute.ps1` | Runs `python -m maquetalab.pipeline` with your arguments, e.g. `./scripts/precompute.sh berlin_mitte --fetched 2026-07-12`. |
| `smoke.sh` / `smoke.ps1` | The two data checks CI runs: `maquetalab.regen_index --check`, then `check_artifacts.py`. |
| `dev.sh` / `dev.ps1` | Copies the bundles into `frontend/public/data` and starts the frontend dev server. |

## Guards (run in CI, runnable locally)

| Script | What it enforces |
|---|---|
| `check_artifacts.py` | CONTRACT 2 on disk, in both directions: index, manifests, GLB layers, `admin.json` and benchmark agree, and no file ships that no manifest names. Stdlib only. |
| `check_template_residue.py` | No archetype example residue (the example package, its SIR cases, placeholder text) and no `deploy-pages.yml`, a deploy path this product does not use. |
| `check_content_standards.py` | No em-dash and no pictographic emoji in tracked text files (ADR-0067). |
