"""Regenerate index.json + benchmark.json from the place bundles on disk in data/derived.

This module is the single writer of the place index and the cross-place benchmark. The pipeline calls it
after baking and after meshopt compression, so the byte sizes it records are the ones the site ships, and
a one-place bake refreshes the index without dropping the places baked earlier. It reads each place's
manifest.json plus the place registry; directories that are not registered places, or whose manifest
cannot be read, are skipped. The output is a pure function of the committed bundles, which is what the
CI smoke checks.

    python -m maquetalab.regen_index                # rewrite data/derived/index.json + benchmark.json
    python -m maquetalab.regen_index --output DIR   # write the two files into DIR instead (a sandbox)
    python -m maquetalab.regen_index --check        # write nothing; exit 1 unless the committed files
                                                    # already equal the regeneration
"""

from __future__ import annotations

import argparse
import difflib
import json
import sys
from pathlib import Path

from . import places
from .benchmark import build_benchmark

REPO_ROOT = Path(__file__).resolve().parents[2]
DERIVED = REPO_ROOT / "data" / "derived"
OUTPUTS = ("index.json", "benchmark.json")


def _summary_from_manifest(slug: str, manifest: dict, derived: Path = DERIVED) -> dict:
    p = places.get_place(slug)
    layers = manifest.get("layers", [])
    total_tris = sum(layer["stats"].get("triangles", 0) for layer in layers)
    total_bytes = sum(
        (derived / slug / layer["file"]).stat().st_size
        for layer in layers
        if (derived / slug / layer["file"]).exists()
    )
    return {
        "slug": slug,
        "name": p.name,
        "tier": p.tier,
        "category": p.category,
        "continent": p.continent,
        "country": p.country,
        "city": p.city,
        "note": p.note,
        "n_layers": len([layer for layer in layers if layer.get("name") != "buildings_lite"]),
        "total_triangles": int(total_tris),
        "total_bytes": int(total_bytes),
        "height_mix": manifest.get("stats", {}).get("height_mix", {}),
        "ground_truth": manifest.get("stats", {}).get("ground_truth"),
        "any_noncommercial": manifest.get("any_noncommercial", False),
        "credits": manifest.get("credits", []),
        "notes": manifest.get("stats", {}).get("notes", []),
        "manifest_path": f"{slug}/manifest.json",
    }


def collect_summaries(derived: Path = DERIVED) -> list[dict]:
    """One summary per registered place that has a readable manifest under `derived`, in slug order."""
    summaries = []
    for slug_dir in sorted(derived.glob("*/")):
        man = slug_dir / "manifest.json"
        if not man.exists():
            continue
        slug = slug_dir.name
        try:
            places.get_place(slug)
        except KeyError:
            continue
        try:
            manifest = json.loads(man.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue  # a manifest being written by a concurrent bake; skip this round
        summaries.append(_summary_from_manifest(slug, manifest, derived))
    return summaries


def render(summaries: list[dict]) -> dict[str, str]:
    """The exact text of index.json and benchmark.json for these summaries."""
    index = {
        "schema_version": 1,
        "n_places": len(summaries),
        "tiers": places.by_tier(),
        "hierarchy": places.hierarchy(),
        "places": [
            {
                "slug": s["slug"],
                "name": s["name"],
                "tier": s["tier"],
                "category": s["category"],
                "continent": s["continent"],
                "country": s["country"],
                "city": s["city"],
                "n_layers": s["n_layers"],
                "total_bytes": s["total_bytes"],
                "manifest_path": s["manifest_path"],
            }
            for s in summaries
        ],
    }
    return {
        "index.json": json.dumps(index, indent=2),
        "benchmark.json": json.dumps(build_benchmark(summaries), indent=2),
    }


def write(out_dir: Path = DERIVED, derived: Path = DERIVED) -> int:
    """Regenerate from the bundles in `derived`, write both files into `out_dir`, return the place count."""
    summaries = collect_summaries(derived)
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, text in render(summaries).items():
        (out_dir / name).write_text(text, encoding="utf-8")
    return len(summaries)


def check(derived: Path = DERIVED) -> tuple[int, list[str]]:
    """Compare the files in `derived` with the regeneration; write nothing.

    Returns the place count and the names of the files that differ (empty when in sync). Files are read
    in text mode, so a checkout with CRLF line endings compares equal to the LF regeneration.
    """
    summaries = collect_summaries(derived)
    drift = []
    for name, text in render(summaries).items():
        path = derived / name
        current = path.read_text(encoding="utf-8") if path.exists() else ""
        if current == text:
            continue
        drift.append(name)
        diff = list(
            difflib.unified_diff(
                current.splitlines(), text.splitlines(), f"committed/{name}", f"regenerated/{name}",
                lineterm="", n=1,
            )
        )
        print("\n".join(diff[:40]))
        if len(diff) > 40:
            print(f"... ({len(diff) - 40} more diff lines)")
    return len(summaries), drift


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="maquetalab.regen_index",
        description="Regenerate data/derived/index.json + benchmark.json from the bundles on disk.",
    )
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--output", type=Path, help="write the two files into this directory instead")
    mode.add_argument(
        "--check", action="store_true",
        help="write nothing; exit 1 if the committed index.json or benchmark.json differ from the regeneration",
    )
    args = ap.parse_args(argv)

    if args.check:
        n, drift = check()
        if drift:
            print(
                f"DRIFT: {', '.join(drift)} no longer match(es) the {n} bundles in {DERIVED}. "
                "Run `python -m maquetalab.regen_index` and commit the result."
            )
            return 1
        print(f"regen_index --check OK: {', '.join(OUTPUTS)} reproduce from the {n} bundles in {DERIVED}.")
        return 0

    out_dir = args.output or DERIVED
    n = write(out_dir)
    print(f"regenerated index.json + benchmark.json for {n} places -> {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
