#!/usr/bin/env bash
# Run the offline bake pipeline (pass-through args). E.g.:  ./scripts/precompute.sh berlin_mitte --fetched 2026-07-12
# Needs the bake lane in .venv-pipeline: pip install -r data-pipeline/requirements-bake.txt.
set -euo pipefail
cd "$(dirname "$0")/.."
VP=".venv-pipeline/bin/python"; [ -x "$VP" ] || VP=".venv-pipeline/Scripts/python.exe"
"$VP" data-pipeline/run.py bake "$@"
