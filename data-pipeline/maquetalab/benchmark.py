"""Cross-place benchmark summary (the Benchmark surface's data).

Aggregates the per-place bake summaries into honest cross-place statistics: the
height-provenance mix by place and tier (how much of each scene is measured vs inferred),
mesh + byte budgets, layer coverage, and any non-commercial-license flags. All computed
offline from the committed bundles; the web app only renders it.
"""

from __future__ import annotations


def _mix_fraction(mix: dict[str, int]) -> dict[str, float]:
    total = sum(mix.values()) or 1
    return {k: round(v / total, 3) for k, v in mix.items()}


def build_benchmark(summaries: list[dict]) -> dict:
    per_place = []
    tier_bytes: dict[str, int] = {}
    tier_count: dict[str, int] = {}
    agg_mix = {"measured": 0, "floors": 0, "raster": 0, "prior": 0}
    for s in summaries:
        mix = {k: int(s.get("height_mix", {}).get(k, 0)) for k in agg_mix}
        for k in agg_mix:
            agg_mix[k] += mix[k]
        tier_bytes[s["tier"]] = tier_bytes.get(s["tier"], 0) + s["total_bytes"]
        tier_count[s["tier"]] = tier_count.get(s["tier"], 0) + 1
        per_place.append(
            {
                "slug": s["slug"],
                "name": s["name"],
                "tier": s["tier"],
                "country": s["country"],
                "n_layers": s["n_layers"],
                "total_triangles": s["total_triangles"],
                "total_mb": round(s["total_bytes"] / 1e6, 3),
                "height_mix": mix,
                "height_fraction": _mix_fraction(mix),
                "measured_pct": round(100 * mix["measured"] / (sum(mix.values()) or 1), 1),
                "any_noncommercial": s["any_noncommercial"],
                "ground_truth": s.get("ground_truth"),
            }
        )
    return {
        "schema_version": 1,
        "n_places": len(summaries),
        "global_height_mix": agg_mix,
        "global_height_fraction": _mix_fraction(agg_mix),
        "tier_totals_mb": {k: round(v / 1e6, 2) for k, v in tier_bytes.items()},
        "tier_counts": tier_count,
        "total_mb": round(sum(s["total_bytes"] for s in summaries) / 1e6, 2),
        "per_place": sorted(per_place, key=lambda x: (x["tier"], x["slug"])),
    }
