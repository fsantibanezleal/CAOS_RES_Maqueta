#!/usr/bin/env bash
# Smoke: the two data checks CI runs. The committed index.json + benchmark.json must reproduce from the bundles
# (writes nothing), and CONTRACT 2 must hold on disk (index, manifests, GLB layers and benchmark agree).
set -euo pipefail
cd "$(dirname "$0")/.."
PY=".venv-pipeline/bin/python"; [ -x "$PY" ] || PY=".venv-pipeline/Scripts/python.exe"
[ -x "$PY" ] || PY="${PYTHON:-python}"
"$PY" -m maquetalab.regen_index --check
"$PY" scripts/check_artifacts.py
