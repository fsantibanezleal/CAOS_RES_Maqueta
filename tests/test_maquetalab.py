"""Offline tests for maquetalab (no network): the place registry and the benchmark aggregation."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "data-pipeline"))

from maquetalab import places  # noqa: E402
from maquetalab.benchmark import build_benchmark  # noqa: E402


def test_place_registry_shape():
    ps = places.list_places()
    assert 30 <= len(ps) <= 50, "target 30-50 places"
    slugs = [p.slug for p in ps]
    assert len(slugs) == len(set(slugs)), "slugs unique"
    # Chile is represented in tier B + C
    countries = {p.country for p in ps}
    assert "Chile" in countries
    # every tier present
    assert set(places.by_tier()) == {"A", "B", "C"}


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
