#!/usr/bin/env bash
# Create BOTH venvs + install per-lane requirements. Idempotent. No global installs. The pipeline code itself is
# never installed (conventions/no-internal-packages.md): data-pipeline/run.py runs it by path.
#   .venv-pipeline = pipeline lane (data-pipeline/requirements.txt) + dev tools             (local-only)
#                    add the bake lane for baking: pip install -r data-pipeline/requirements-bake.txt
#   .venv          = archetype runtime lane (requirements.txt)
# Re-runnable.
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python}"

mkvenv() { [ -d "$1" ] || "$PY" -m venv "$1"; }
venvpy() { local p="$1/bin/python"; [ -x "$p" ] || p="$1/Scripts/python.exe"; echo "$p"; }

echo "[setup] .venv-pipeline (pipeline lane)…"
mkvenv .venv-pipeline
VP="$(venvpy .venv-pipeline)"
"$VP" -m pip install --upgrade pip -q
"$VP" -m pip install -q -r data-pipeline/requirements.txt -r requirements-dev.txt
echo "[setup] .venv-pipeline ready."

echo "[setup] .venv (runtime lane)…"
mkvenv .venv
VR="$(venvpy .venv)"
"$VR" -m pip install --upgrade pip -q
"$VR" -m pip install -q -r requirements.txt
echo "[setup] .venv ready."

echo "[setup] done. Next:  ./scripts/smoke.sh   (baking also needs data-pipeline/requirements-bake.txt)"
