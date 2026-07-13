"""Regenerate index.json + benchmark.json from whatever place bundles already exist in data/derived.

Decouples the index from a full batch run so partially-baked sets can be shipped/inspected and the
index stays in sync as places accumulate. Reads each place's manifest.json + the place registry.

    python -m maquetalab.regen_index
"""

from __future__ import annotations

import json
from pathlib import Path

from . import places
from .benchmark import build_benchmark

REPO_ROOT = Path(__file__).resolve().parents[2]
DERIVED = REPO_ROOT / "data" / "derived"


def _summary_from_manifest(slug: str, manifest: dict) -> dict:
    p = places.get_place(slug)
    layers = manifest.get("layers", [])
    total_tris = sum(l["stats"].get("triangles", 0) for l in layers)
    total_bytes = sum(
        (DERIVED / slug / l["file"]).stat().st_size
        for l in layers
        if (DERIVED / slug / l["file"]).exists()
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
        "n_layers": len(layers),
        "total_triangles": int(total_tris),
        "total_bytes": int(total_bytes),
        "height_mix": manifest.get("stats", {}).get("height_mix", {}),
        "ground_truth": manifest.get("stats", {}).get("ground_truth"),
        "any_noncommercial": manifest.get("any_noncommercial", False),
        "credits": manifest.get("credits", []),
        "notes": manifest.get("stats", {}).get("notes", []),
        "manifest_path": f"{slug}/manifest.json",
    }


def main() -> None:
    summaries = []
    for slug_dir in sorted(DERIVED.glob("*/")):
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
        summaries.append(_summary_from_manifest(slug, manifest))

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
    (DERIVED / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (DERIVED / "benchmark.json").write_text(
        json.dumps(build_benchmark(summaries), indent=2), encoding="utf-8"
    )
    print(f"regenerated index.json + benchmark.json for {len(summaries)} places -> {DERIVED}")


if __name__ == "__main__":
    main()
