"""Make data-pipeline/ importable for the tests, as data-pipeline/run.py does for the CLI.

The pipeline code is a plain folder (data-pipeline/pipeline/), not an installed package: nothing here, in CI or
in scripts/setup.* runs `pip install` for it (conventions/no-internal-packages.md).
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "data-pipeline"))
