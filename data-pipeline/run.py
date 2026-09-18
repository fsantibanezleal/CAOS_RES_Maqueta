#!/usr/bin/env python3
"""Maqueta's offline pipeline, invoked BY PATH: never installed, never a distribution.

A product declares no package of its own (conventions/no-internal-packages.md): the code this runs lives in
the plain folder data-pipeline/pipeline/, which is importable only because this script puts its own folder on
sys.path.

    python data-pipeline/run.py bake [place] --fetched YYYY-MM-DD [--tier A|B|C] [--no-compress] [--compress-only]
    python data-pipeline/run.py regen-index [--check | --output DIR]
    python data-pipeline/run.py gen-admin

`bake` and `gen-admin` need the bake lane (data-pipeline/requirements-bake.txt). `regen-index` needs only the
pipeline lane (data-pipeline/requirements.txt), which is why CI can run it: each command's module is imported
only when that command runs.
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

COMMANDS = {
    "bake": "pipeline.pipeline",
    "regen-index": "pipeline.regen_index",
    "gen-admin": "pipeline.gen_admin",
}


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else list(argv)
    if args and args[0] in ("-h", "--help"):
        print(__doc__.strip())
        return 0
    if not args or args[0] not in COMMANDS:
        print(__doc__.strip())
        print(f"\nrun.py: expected a command, one of: {', '.join(COMMANDS)}")
        return 2
    module = importlib.import_module(COMMANDS[args[0]])
    return module.main(args[1:]) or 0


if __name__ == "__main__":
    sys.exit(main())
