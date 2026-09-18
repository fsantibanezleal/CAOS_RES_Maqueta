#!/usr/bin/env bash
# Run the offline bake pipeline (pass-through args). E.g.:  ./scripts/precompute.sh berlin_mitte --fetched 2026-07-12
# Needs the geoscena core in .venv-pipeline (see data-pipeline/README.md, "Dependencies").
set -euo pipefail
cd "$(dirname "$0")/.."
VP=".venv-pipeline/bin/python"; [ -x "$VP" ] || VP=".venv-pipeline/Scripts/python.exe"
"$VP" -m maquetalab.pipeline "$@"
