"""The CONTRACT 2 guard (scripts/check_artifacts.py): the committed bundles pass, and each drift fails.

Every fault is injected into a sandbox copy of the two smallest places, never into data/derived.
"""

from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

import pytest
from pipeline import regen_index

REPO = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("check_artifacts", REPO / "scripts" / "check_artifacts.py")
check_artifacts = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(check_artifacts)

DERIVED = REPO / "data" / "derived"


def _by_size() -> list[str]:
    index = json.loads((DERIVED / "index.json").read_text(encoding="utf-8"))
    return [entry["slug"] for entry in sorted(index["places"], key=lambda entry: entry["total_bytes"])]


def _errors(derived: Path) -> list[str]:
    return check_artifacts.check(derived)[0]


def test_committed_bundles_satisfy_contract_2():
    errs, summary = check_artifacts.check(DERIVED)
    assert errs == []
    index = json.loads((DERIVED / "index.json").read_text(encoding="utf-8"))
    assert summary["places"] == index["n_places"]
    assert summary["layers"] >= summary["places"]


@pytest.fixture
def sandbox(tmp_path: Path) -> Path:
    """The two smallest committed places, with an index + benchmark regenerated for just them."""
    derived = tmp_path / "derived"
    for slug in _by_size()[:2]:
        shutil.copytree(DERIVED / slug, derived / slug)
    regen_index.write(derived, derived)
    assert _errors(derived) == []
    return derived


def _first(derived: Path) -> tuple[str, dict]:
    slug = sorted(p.name for p in derived.iterdir() if p.is_dir())[0]
    return slug, json.loads((derived / slug / "manifest.json").read_text(encoding="utf-8"))


def test_truncated_glb_fails(sandbox):
    slug, manifest = _first(sandbox)
    path = sandbox / slug / manifest["layers"][0]["file"]
    path.write_bytes(path.read_bytes()[:-1])
    errs = _errors(sandbox)
    assert any("GLB header says" in e for e in errs)
    assert any("total_bytes" in e for e in errs)


def test_missing_layer_file_fails(sandbox):
    slug, manifest = _first(sandbox)
    (sandbox / slug / manifest["layers"][0]["file"]).unlink()
    assert any("named by the manifest but missing" in e for e in _errors(sandbox))


def test_file_named_by_no_manifest_fails(sandbox):
    slug, _ = _first(sandbox)
    (sandbox / slug / "water.glb").write_bytes(b"glTF")
    assert any(e.startswith(f"{slug}/water.glb") and "named by no manifest" in e for e in _errors(sandbox))


def test_layer_without_license_fails(sandbox):
    slug, manifest = _first(sandbox)
    del manifest["layers"][0]["provenance"]["license"]
    (sandbox / slug / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    assert any("provenance has no 'license'" in e for e in _errors(sandbox))


def test_bundle_missing_from_the_index_fails(sandbox):
    extra = _by_size()[2]
    shutil.copytree(DERIVED / extra, sandbox / extra)
    assert any(e.startswith(f"{extra}/: a baked bundle the index does not list") for e in _errors(sandbox))


def test_benchmark_that_disagrees_with_the_index_fails(sandbox):
    bench = json.loads((sandbox / "benchmark.json").read_text(encoding="utf-8"))
    bench["per_place"][0]["total_mb"] += 1
    (sandbox / "benchmark.json").write_text(json.dumps(bench), encoding="utf-8")
    assert any(e.startswith("benchmark.json:") and "total_mb" in e for e in _errors(sandbox))
