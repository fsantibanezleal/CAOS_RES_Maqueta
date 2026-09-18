# Run the offline bake pipeline (pass-through args). E.g.:  ./scripts/precompute.ps1 berlin_mitte --fetched 2026-07-12
# Needs the geoscena core in .venv-pipeline (see data-pipeline/README.md, "Dependencies").
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$vp = Join-Path ".venv-pipeline" "Scripts\python.exe"
if (-not (Test-Path $vp)) { $vp = Join-Path ".venv-pipeline" "bin/python" }
& $vp -m maquetalab.pipeline @args
exit $LASTEXITCODE
