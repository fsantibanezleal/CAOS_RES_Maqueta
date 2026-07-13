"""Bake one Place into a committed SceneBundle.

This is Maqueta's core stage: it turns a `Place` into an `AOI`, runs the geoscena fetch ->
fuse -> mesh pipeline (the "engine"), writes the per-layer .glb + manifest into
`data/derived/<slug>/`, and returns a compact summary for the place index and the Benchmark
surface. Layer-tolerant: a wilderness place with no buildings bakes its terrain and records
the gap rather than failing.
"""

from __future__ import annotations

from pathlib import Path

from geoscena.aoi import AOI
from geoscena.build import BuildConfig, build_scene

from .places import Place

# data-pipeline/maquetalab/build.py -> parents[2] = repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
DERIVED = REPO_ROOT / "data" / "derived"


def _terrain_knobs(place: Place) -> tuple[float, int]:
    """Terrain-first (tier C) areas cover more ground, so allow a coarser error + more verts."""
    if place.tier == "C":
        return (3.0, 9000)
    return (1.2, 6000)


def bake_place(place: Place, fetched: str, out_root: Path | None = None) -> dict:
    """Fetch, fuse, mesh and write the SceneBundle for a place. Returns a summary dict."""
    out_root = out_root or DERIVED
    aoi = AOI.from_center(place.name, place.lon, place.lat, place.half_size_m)
    err, verts = _terrain_knobs(place)
    cfg = BuildConfig(
        fetched=fetched,
        terrain_max_error_m=err,
        terrain_max_vertices=verts,
        # terrain-first areas skip the building/road fetch (they have little/none)
        include_buildings=place.tier != "C",
        include_roads=place.tier != "C",
        include_context=True,
    )
    bundle = build_scene(aoi, cfg)
    out_dir = out_root / place.slug
    bundle.write(out_dir)

    man = bundle.to_manifest()
    total_tris = sum(l["stats"].get("triangles", 0) for l in man["layers"])
    total_bytes = sum(
        (out_dir / l["file"]).stat().st_size for l in man["layers"] if (out_dir / l["file"]).exists()
    )
    return {
        "slug": place.slug,
        "name": place.name,
        "tier": place.tier,
        "category": place.category,
        "country": place.country,
        "note": place.note,
        "layers": [l["name"] for l in man["layers"]],
        "n_layers": len(man["layers"]),
        "total_triangles": int(total_tris),
        "total_bytes": int(total_bytes),
        "height_mix": man["stats"].get("height_mix", {}),
        "any_noncommercial": man["any_noncommercial"],
        "credits": man["credits"],
        "notes": man["stats"].get("notes", []),
        "manifest_path": f"{place.slug}/manifest.json",
    }
