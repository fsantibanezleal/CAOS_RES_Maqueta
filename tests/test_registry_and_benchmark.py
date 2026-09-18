"""Offline tests for the pipeline code (no network): the place registry and the benchmark aggregation."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline import places
from pipeline.benchmark import build_benchmark

REPO = Path(__file__).resolve().parents[1]
INDEX = REPO / "data" / "derived" / "index.json"


def test_place_registry_shape():
    ps = places.list_places()
    slugs = [p.slug for p in ps]
    assert len(slugs) == len(set(slugs)), "slugs unique"
    assert all(p.half_size_m > 0 for p in ps)
    assert all(-180 <= p.lon <= 180 and -90 <= p.lat <= 90 for p in ps)
    # Chile is represented in tier B + C
    countries = {p.country for p in ps}
    assert "Chile" in countries
    # every tier present
    assert set(places.by_tier()) == {"A", "B", "C"}
    # the continent > country > city hierarchy lists every place exactly once
    in_tree = [
        slug
        for cont in places.hierarchy()
        for country in cont["countries"]
        for city in country["cities"]
        for slug in city["slugs"]
    ]
    assert sorted(in_tree) == sorted(slugs)


def test_registry_matches_baked_index():
    """Every registered place is baked and indexed, and the index lists nothing else.

    This replaces a 30-50 count window written for the first 40-place plan; the registry has grown
    to 118 places on purpose, and what must hold at any size is that the registry and the bundles the
    site ships describe the same set.
    """
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    indexed = [entry["slug"] for entry in index["places"]]
    assert index["n_places"] == len(indexed) == len(set(indexed))
    assert set(indexed) == {p.slug for p in places.list_places()}


def test_place_lookup_and_category():
    p = places.get_place("berlin_mitte")
    assert p.tier == "A"
    assert p.category == "ground-truth"
    assert p.half_size_m > 0


def test_benchmark_aggregation():
    summaries = [
        {
            "slug": "a",
            "name": "A",
            "tier": "A",
            "country": "X",
            "n_layers": 3,
            "total_triangles": 1000,
            "total_bytes": 2_000_000,
            "height_mix": {"measured": 8, "floors": 2, "raster": 0, "prior": 0},
            "any_noncommercial": False,
        },
        {
            "slug": "b",
            "name": "B",
            "tier": "B",
            "country": "Chile",
            "n_layers": 3,
            "total_triangles": 3000,
            "total_bytes": 4_000_000,
            "height_mix": {"measured": 1, "floors": 1, "raster": 6, "prior": 2},
            "any_noncommercial": False,
        },
    ]
    b = build_benchmark(summaries)
    assert b["n_places"] == 2
    assert b["global_height_mix"] == {"measured": 9, "floors": 3, "raster": 6, "prior": 2}
    # fractions sum ~1
    assert abs(sum(b["global_height_fraction"].values()) - 1.0) < 1e-6
    assert b["total_mb"] == 6.0
    # place A is 80% measured
    a = next(p for p in b["per_place"] if p["slug"] == "a")
    assert a["measured_pct"] == 80.0
