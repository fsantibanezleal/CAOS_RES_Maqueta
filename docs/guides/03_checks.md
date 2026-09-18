# Guide 03, run the checks CI runs

From the repository root, with `.venv-pipeline` from [guide 00](00_setup.md) (use `Scripts\python.exe` on
Windows):

```bash
PY=.venv-pipeline/bin/python
$PY -m ruff check data-pipeline tests scripts      # lint
$PY -m pytest                                      # tests, including the guards' fault-injection tests
$PY -m maquetalab.regen_index --check              # index + benchmark reproduce from the bundles
$PY scripts/check_artifacts.py                     # CONTRACT 2 in both directions
$PY scripts/check_template_residue.py              # no archetype residue, no Pages workflow
$PY scripts/check_content_standards.py             # no em-dash, no emoji
cd frontend && npm ci && npm test && npm run build # the SPA type-checks, its tests pass, it builds
```

`./scripts/smoke.sh` runs the two data checks in one go. The full list and what each step guards is in
[architecture/07](../architecture/07_deploy.md). None of these checks writes to `data/derived`; the tests
that inject faults work on copies in a temporary folder.
