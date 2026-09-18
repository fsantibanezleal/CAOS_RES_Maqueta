"""The place index + benchmark are a pure function of the committed bundles (regen_index).

The CI smoke runs `python data-pipeline/run.py regen-index --check`; these tests pin the same property from
pytest and prove the check fails when a bundle changes, so a green smoke means something.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from pipeline import places, regen_index

REPO = Path(__file__).resolve().parents[1]
DERIVED = REPO / "data" / "derived"


def _smallest_places(n: int) -> list[str]:
    index = json.loads((DERIVED / "index.json").read_text(encoding="utf-8"))
    ranked = sorted(index["places"], key=lambda entry: entry["total_bytes"])
    return [entry["slug"] for entry in ranked[:n]]


def _sandbox(tmp_path: Path, slugs: list[str]) -> Path:
    derived = tmp_path / "derived"
    for slug in slugs:
        shutil.copytree(DERIVED / slug, derived / slug)
    return derived


def test_committed_index_and_benchmark_reproduce():
    n, drift = regen_index.check()
    assert drift == [], f"regenerated files differ from the committed ones: {drift}"
    assert n == len(places.list_places())


def test_written_files_are_byte_identical_to_the_committed_ones(tmp_path):
    """Byte for byte, on every OS: the writer emits LF, as git stores the committed files."""
    out = tmp_path / "out"
    regen_index.write(out)
    for name in regen_index.OUTPUTS:
        assert (out / name).read_bytes() == (DERIVED / name).read_bytes(), name


def test_cli_check_exit_code(capsys):
    assert regen_index.main(["--check"]) == 0
    assert "--check OK" in capsys.readouterr().out


def test_write_then_check_round_trip(tmp_path):
    derived = _sandbox(tmp_path, _smallest_places(2))
    assert regen_index.write(derived, derived) == 2
    n, drift = regen_index.check(derived)
    assert (n, drift) == (2, [])
    index = json.loads((derived / "index.json").read_text(encoding="utf-8"))
    assert [entry["slug"] for entry in index["places"]] == sorted(p.name for p in derived.iterdir() if p.is_dir())


def test_check_detects_a_changed_bundle_and_writes_nothing(tmp_path):
    derived = _sandbox(tmp_path, _smallest_places(2))
    regen_index.write(derived, derived)
    before = {name: (derived / name).read_bytes() for name in regen_index.OUTPUTS}

    slug = sorted(p.name for p in derived.iterdir() if p.is_dir())[0]
    layer = json.loads((derived / slug / "manifest.json").read_text(encoding="utf-8"))["layers"][0]["file"]
    with open(derived / slug / layer, "ab") as f:
        f.write(b"\0")  # the bundle now has one more byte than the index records

    _, drift = regen_index.check(derived)
    assert "index.json" in drift
    assert {name: (derived / name).read_bytes() for name in regen_index.OUTPUTS} == before


def test_output_sandbox_leaves_the_source_untouched(tmp_path):
    derived = _sandbox(tmp_path, _smallest_places(1))
    out = tmp_path / "out"
    assert regen_index.write(out, derived) == 1
    assert sorted(p.name for p in out.iterdir()) == sorted(regen_index.OUTPUTS)
    assert not any((derived / name).exists() for name in regen_index.OUTPUTS)
