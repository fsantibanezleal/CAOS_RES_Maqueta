"""data-pipeline/run.py is the only way to run the pipeline, by path, with nothing installed.

conventions/no-internal-packages.md: a product declares no package of its own, and no product package carries
`lab` in its name. These tests pin both, and pin that the CI-facing command never needs the bake lane.
"""

from __future__ import annotations

import importlib.util
import subprocess
import sys
import tomllib
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RUN_PY = REPO / "data-pipeline" / "run.py"


def _run(*args: str, cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(RUN_PY), *args], cwd=cwd, capture_output=True, text=True)


def test_regen_index_check_runs_by_path_from_any_folder(tmp_path):
    for cwd in (REPO, tmp_path):
        done = _run("regen-index", "--check", cwd=cwd)
        assert done.returncode == 0, done.stdout + done.stderr
        assert "--check OK" in done.stdout


def test_unknown_or_missing_command_prints_usage():
    for args in ((), ("pipeline",)):
        done = _run(*args, cwd=REPO)
        assert done.returncode == 2
        assert "bake" in done.stdout and "regen-index" in done.stdout and "gen-admin" in done.stdout
    assert _run("--help", cwd=REPO).returncode == 0


def test_regen_index_never_imports_the_bake_lane():
    spec = importlib.util.spec_from_file_location("maqueta_run", RUN_PY)
    run = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(run)
    before = set(sys.modules)
    assert run.main(["regen-index", "--check"]) == 0
    loaded = set(sys.modules) - before
    assert not any(name == "geoscena" or name.startswith("geoscena.") for name in loaded)


def test_the_repository_declares_no_package():
    config = tomllib.loads((REPO / "pyproject.toml").read_text(encoding="utf-8"))
    assert "project" not in config and "build-system" not in config, "pyproject.toml is tool configuration only"
    folders = [p.name for p in (REPO / "data-pipeline").iterdir() if p.is_dir()]
    assert not [name for name in folders if "lab" in name.lower()], folders
