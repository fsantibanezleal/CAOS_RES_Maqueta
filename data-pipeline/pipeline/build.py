"""Bake one Place into a committed SceneBundle.

This is Maqueta's core stage: it turns a `Place` into an `AOI`, runs the geoscena fetch ->
fuse -> mesh pipeline (the "engine"), writes the per-layer .glb + manifest into
`data/derived/<slug>/`, and returns a compact summary for the place index and the Benchmark
surface. Layer-tolerant: a wilderness place with no buildings bakes its terrain and records
the gap rather than failing.
"""

from __future__ import annotations

import os
from pathlib import Path

from geoscena.aoi import AOI
from geoscena.build import BuildConfig, build_scene

from .places import Place

# data-pipeline/pipeline/build.py -> parents[2] = repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
DERIVED = REPO_ROOT / "data" / "derived"


def _terrain_knobs(place: Place) -> tuple[float, int]:
    """Terrain-first (tier C) areas cover more ground, so allow a coarser error + more verts."""
    if place.tier == "C":
        return (3.0, 9000)
    return (1.2, 6000)


def _remove_previous_layers(out_dir: Path) -> None:
    """Delete the .glb layers of the previous bake of this place before the new bundle is written.

    A re-bake can yield fewer layers than the last one (OSM context skipped with MAQUETA_NO_CONTEXT=1,
    or a place resized so it no longer gets the buildings_lite proxy). Without this the old files stay
    in the folder, ship with the site although no manifest names them, and fail the CONTRACT 2 check
    (scripts/check_artifacts.py). admin.json is kept: gen_admin writes it after the bake.
    """
    if out_dir.is_dir():
        for stale in out_dir.glob("*.glb"):
            stale.unlink()


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
        include_roads=place.tier != "C" and os.environ.get("MAQUETA_NO_ROADS", "") != "1",
        # OSM context (water/green/rail) via Overpass can be slow; MAQUETA_NO_CONTEXT=1 skips it
        # so a bake never blocks on the public Overpass queue (the context layers are optional).
        include_context=os.environ.get("MAQUETA_NO_CONTEXT", "") != "1",
    )
    bundle = build_scene(aoi, cfg)
    out_dir = out_root / place.slug
    _remove_previous_layers(out_dir)  # only once the new bundle exists; a failed fetch keeps the old one
    bundle.write(out_dir)

    man = bundle.to_manifest()
    total_tris = sum(layer["stats"].get("triangles", 0) for layer in man["layers"])
    total_bytes = sum(
        (out_dir / layer["file"]).stat().st_size
        for layer in man["layers"]
        if (out_dir / layer["file"]).exists()
    )
    return {
        "slug": place.slug,
        "name": place.name,
        "tier": place.tier,
        "category": place.category,
        "continent": place.continent,
        "country": place.country,
        "city": place.city,
        "note": place.note,
        "layers": [layer["name"] for layer in man["layers"]],
        "n_layers": len([layer for layer in man["layers"] if layer["name"] != "buildings_lite"]),
        "total_triangles": int(total_tris),
        "total_bytes": int(total_bytes),
        "height_mix": man["stats"].get("height_mix", {}),
        "ground_truth": man["stats"].get("ground_truth"),
        "any_noncommercial": man["any_noncommercial"],
        "credits": man["credits"],
        "notes": man["stats"].get("notes", []),
        "manifest_path": f"{place.slug}/manifest.json",
    }
