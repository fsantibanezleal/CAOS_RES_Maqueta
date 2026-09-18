"""Validate CONTRACT 2 on disk (the pipeline -> web artifact contract) for Maqueta's baked SceneBundles.

What the web app loads is data/derived/index.json, then one data/derived/<slug>/manifest.json per place,
then the .glb layers that manifest names (plus an optional admin.json), and data/derived/benchmark.json
for the Benchmark page. This guard checks that all of it agrees, in both directions:

  index.json      schema 1; one entry per place, unique slugs; n_places matches; manifest_path is
                  <slug>/manifest.json; no bundle directory on disk is missing from the index.
  manifest.json   schema 1; the fields the TypeScript mirror (frontend/src/lib/contract.types.ts)
                  requires; at least one layer; unique layer names; every layer carries provenance with a
                  source, a license and a fetch date (CONTRACT 1: no layer enters a bundle without it);
                  a height mix over the four provenance rungs only.
  .glb layers     each named file exists and is a glTF 2.0 binary whose header length equals its size
                  (a truncated or corrupt file fails); no file in a place folder that no manifest names.
  index entries   total_bytes = the summed size of the layer files; n_layers = the layers other than the
                  buildings_lite level-of-detail proxy.
  benchmark.json  the same places as the index, each with total_mb = total_bytes / 1e6 (3 decimals).

Stdlib only, so it runs without installing the pipeline and shares no code with the writer it checks.
Used by scripts/smoke.{sh,ps1} and the CI workflow. Exit non-zero on any drift.
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DERIVED = ROOT / "data" / "derived"

SCHEMA_VERSION = 1
HEIGHT_RUNGS = {"measured", "floors", "raster", "prior"}
LOD_PROXY = "buildings_lite"  # a lighter copy of `buildings` for progressive load, not a modality
SIDECARS = {"manifest.json", "admin.json"}  # files a place folder may hold besides its layers
MANIFEST_KEYS = ("schema_version", "aoi", "layers", "stats", "any_noncommercial", "credits")
AOI_KEYS = ("name", "bbox_wgs84", "origin_wgs84", "crs_local", "size_m")
PROVENANCE_REQUIRED = ("source", "license", "fetched")
MAX_REPORTED = 60


def _shown(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _load_json(path: Path, errs: list[str]) -> object | None:
    if not path.exists():
        errs.append(f"missing: {_shown(path)}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        errs.append(f"unreadable JSON: {_shown(path)} ({e})")
        return None


def _glb_problem(path: Path) -> str | None:
    """None if `path` is a glTF 2.0 binary whose header length equals the file size, else the reason."""
    size = path.stat().st_size
    if size < 12:
        return f"{size} bytes, shorter than a GLB header"
    with path.open("rb") as f:
        magic, version, length = struct.unpack("<4sII", f.read(12))
    if magic != b"glTF":
        return f"not a GLB (magic {magic!r})"
    if version != 2:
        return f"GLB version {version}, expected 2"
    if length != size:
        return f"GLB header says {length} bytes, file has {size}"
    return None


def _check_manifest(slug: str, m: dict, derived: Path, errs: list[str]) -> tuple[int, int, set[str]]:
    """Check one manifest and its layer files; returns (layer bytes, non-proxy layer count, file names)."""
    where = f"{slug}/manifest.json"
    for key in MANIFEST_KEYS:
        if key not in m:
            errs.append(f"{where}: missing key '{key}'")
    if m.get("schema_version") != SCHEMA_VERSION:
        errs.append(f"{where}: schema_version {m.get('schema_version')!r}, expected {SCHEMA_VERSION}")
    aoi = m.get("aoi") or {}
    for key in AOI_KEYS:
        if key not in aoi:
            errs.append(f"{where}: aoi missing '{key}'")
    if len(aoi.get("bbox_wgs84") or []) != 4:
        errs.append(f"{where}: aoi.bbox_wgs84 must hold 4 numbers")

    mix = (m.get("stats") or {}).get("height_mix")
    if not isinstance(mix, dict):
        errs.append(f"{where}: stats.height_mix missing")
    else:
        if set(mix) - HEIGHT_RUNGS:
            errs.append(f"{where}: unknown height rungs {sorted(set(mix) - HEIGHT_RUNGS)}")
        if any(not isinstance(v, int) or v < 0 for v in mix.values()):
            errs.append(f"{where}: height_mix counts must be non-negative integers")

    layers = m.get("layers") or []
    if not layers:
        errs.append(f"{where}: no layers")
    names = [layer.get("name") for layer in layers]
    if len(names) != len(set(names)):
        errs.append(f"{where}: duplicate layer names {names}")

    total = 0
    files: set[str] = set()
    for layer in layers:
        name, file = layer.get("name"), layer.get("file")
        if not name or not file:
            errs.append(f"{where}: a layer without a name or file ({layer!r:.80})")
            continue
        if "/" in file or "\\" in file or not file.endswith(".glb"):
            errs.append(f"{where}: layer '{name}' file must be a plain .glb name, got {file!r}")
            continue
        if (layer.get("stats") or {}).get("kind") not in ("mesh", "points"):
            errs.append(f"{where}: layer '{name}' stats.kind must be mesh or points")
        prov = layer.get("provenance") or {}
        for key in PROVENANCE_REQUIRED:
            if not prov.get(key):
                errs.append(f"{where}: layer '{name}' provenance has no '{key}'")
        files.add(file)
        path = derived / slug / file
        if not path.exists():
            errs.append(f"{slug}/{file}: named by the manifest but missing")
            continue
        problem = _glb_problem(path)
        if problem:
            errs.append(f"{slug}/{file}: {problem}")
        total += path.stat().st_size
    n_modalities = len([n for n in names if n != LOD_PROXY])
    return total, n_modalities, files


def check(derived: Path = DERIVED) -> tuple[list[str], dict]:
    """All CONTRACT 2 violations under `derived` (empty = consistent) and a small summary."""
    errs: list[str] = []
    summary = {"places": 0, "layers": 0, "glb_bytes": 0}
    index = _load_json(derived / "index.json", errs)
    if not isinstance(index, dict):
        return errs, summary
    if index.get("schema_version") != SCHEMA_VERSION:
        errs.append(f"index.json: schema_version {index.get('schema_version')!r}, expected {SCHEMA_VERSION}")
    entries = index.get("places") or []
    slugs = [e.get("slug") for e in entries]
    if not entries:
        errs.append("index.json: no places")
    if len(slugs) != len(set(slugs)):
        errs.append("index.json: duplicate slugs")
    if index.get("n_places") != len(entries):
        errs.append(f"index.json: n_places {index.get('n_places')} but {len(entries)} entries")

    on_disk = {p.parent.name for p in derived.glob("*/manifest.json")}
    for slug in sorted(on_disk - set(slugs)):
        errs.append(f"{slug}/: a baked bundle the index does not list")

    for e in entries:
        slug = e.get("slug")
        if e.get("manifest_path") != f"{slug}/manifest.json":
            errs.append(f"index.json: {slug} manifest_path {e.get('manifest_path')!r}")
        m = _load_json(derived / slug / "manifest.json", errs)
        if not isinstance(m, dict):
            continue
        total, n_modalities, files = _check_manifest(slug, m, derived, errs)
        summary["places"] += 1
        summary["layers"] += len(files)
        summary["glb_bytes"] += total
        if e.get("total_bytes") != total:
            errs.append(f"index.json: {slug} total_bytes {e.get('total_bytes')} but its layers hold {total}")
        if e.get("n_layers") != n_modalities:
            errs.append(f"index.json: {slug} n_layers {e.get('n_layers')} but the manifest has {n_modalities}")
        for f in sorted((derived / slug).iterdir()):
            if f.name not in files and f.name not in SIDECARS:
                errs.append(f"{slug}/{f.name}: shipped but named by no manifest (stale bake output?)")
        admin = derived / slug / "admin.json"
        if admin.exists():
            a = _load_json(admin, errs)
            if isinstance(a, dict) and not isinstance(a.get("units"), list):
                errs.append(f"{slug}/admin.json: no 'units' list")

    bench = _load_json(derived / "benchmark.json", errs)
    if isinstance(bench, dict):
        per_place = {p.get("slug"): p for p in bench.get("per_place") or []}
        if bench.get("n_places") != len(entries) or set(per_place) != set(slugs):
            errs.append(
                f"benchmark.json: {bench.get('n_places')} places / {len(per_place)} rows, "
                f"index has {len(entries)}; differing slugs {sorted(set(per_place) ^ set(slugs))[:10]}"
            )
        for e in entries:
            row = per_place.get(e.get("slug"))
            if row and isinstance(e.get("total_bytes"), int):
                expected = round(e["total_bytes"] / 1e6, 3)
                if row.get("total_mb") != expected:
                    errs.append(f"benchmark.json: {e['slug']} total_mb {row.get('total_mb')}, index gives {expected}")
    return errs, summary


def main() -> int:
    errs, s = check(DERIVED)
    if errs:
        print(f"CONTRACT 2 DRIFT ({len(errs)} problems):")
        for e in errs[:MAX_REPORTED]:
            print("  -", e)
        if len(errs) > MAX_REPORTED:
            print(f"  ... and {len(errs) - MAX_REPORTED} more")
        return 1
    print(
        f"CONTRACT 2 OK: {s['places']} places, {s['layers']} GLB layers ({s['glb_bytes'] / 1e6:.1f} MB); "
        "index <-> manifests <-> GLB files <-> benchmark consistent."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
