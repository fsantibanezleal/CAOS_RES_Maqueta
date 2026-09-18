# Run the offline bake pipeline (pass-through args). E.g.:  ./scripts/precompute.ps1 berlin_mitte --fetched 2026-07-12
# Needs the bake lane in .venv-pipeline: pip install -r data-pipeline/requirements-bake.txt.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$vp = Join-Path ".venv-pipeline" "Scripts\python.exe"
if (-not (Test-Path $vp)) { $vp = Join-Path ".venv-pipeline" "bin/python" }
& $vp data-pipeline/run.py bake @args
exit $LASTEXITCODE
