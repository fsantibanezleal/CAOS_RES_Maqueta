# Smoke: the two data checks CI runs. The committed index.json + benchmark.json must reproduce from the bundles
# (writes nothing), and CONTRACT 2 must hold on disk (index, manifests, GLB layers and benchmark agree).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$py = Join-Path ".venv-pipeline" "Scripts\python.exe"
if (-not (Test-Path $py)) { $py = Join-Path ".venv-pipeline" "bin/python" }
if (-not (Test-Path $py)) { $py = if ($env:PYTHON) { $env:PYTHON } else { "python" } }
& $py data-pipeline/run.py regen-index --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $py scripts/check_artifacts.py
exit $LASTEXITCODE
