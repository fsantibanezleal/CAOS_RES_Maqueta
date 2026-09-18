# Create BOTH venvs + install per-lane requirements. Idempotent. No global installs. The pipeline code itself is
# never installed (conventions/no-internal-packages.md): data-pipeline/run.py runs it by path. Baking also needs
# the bake lane: pip install -r data-pipeline/requirements-bake.txt. .ps1 parity of setup.sh.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$py = if ($env:PYTHON) { $env:PYTHON } else { "python" }

function Get-VenvPy($dir) {
  $p = Join-Path $dir "Scripts\python.exe"
  if (-not (Test-Path $p)) { $p = Join-Path $dir "bin/python" }
  return $p
}

Write-Host "[setup] .venv-pipeline (pipeline lane)..."
if (-not (Test-Path ".venv-pipeline")) { & $py -m venv .venv-pipeline }
$vp = Get-VenvPy ".venv-pipeline"
& $vp -m pip install --upgrade pip -q
& $vp -m pip install -q -r data-pipeline/requirements.txt -r requirements-dev.txt
Write-Host "[setup] .venv-pipeline ready."

Write-Host "[setup] .venv (runtime lane)..."
if (-not (Test-Path ".venv")) { & $py -m venv .venv }
$vr = Get-VenvPy ".venv"
& $vr -m pip install --upgrade pip -q
& $vr -m pip install -q -r requirements.txt
Write-Host "[setup] .venv ready."

Write-Host "[setup] done. Next:  ./scripts/smoke.ps1   (baking also needs data-pipeline/requirements-bake.txt)"
