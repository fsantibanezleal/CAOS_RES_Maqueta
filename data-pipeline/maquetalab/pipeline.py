"""The offline pipeline orchestrator + CLI (ADR-0057).

Bakes one place or all places into committed SceneBundles and writes the place index +
benchmark summary that the web app reads.

    python -m maquetalab.pipeline --fetched 2026-07-12                 # all places
    python -m maquetalab.pipeline berlin_mitte --fetched 2026-07-12    # one place
    python -m maquetalab.pipeline --tier A --fetched 2026-07-12        # one tier
"""

from __future__ import annotations

import argparse
import json
import traceback
from pathlib import Path

from . import places
from .benchmark import build_benchmark
from .build import DERIVED, bake_place

REPO_ROOT = Path(__file__).resolve().parents[2]


def _write_index(summaries: list[dict]) -> None:
    DERIVED.mkdir(parents=True, exist_ok=True)
    index = {
        "schema_version": 1,
        "n_places": len(summaries),
        "tiers": places.by_tier(),
        "places": [
            {
                "slug": s["slug"],
                "name": s["name"],
                "tier": s["tier"],
                "category": s["category"],
                "country": s["country"],
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


def run(selected: list[places.Place], fetched: str) -> list[dict]:
    summaries: list[dict] = []
    for p in selected:
        print(f"baking {p.slug} ({p.category}) ...", flush=True)
        try:
            s = bake_place(p, fetched=fetched)
            summaries.append(s)
            print(
                f"  ok: {s['n_layers']} layers, {s['total_triangles']} tris, "
                f"{s['total_bytes'] / 1e6:.2f} MB, height_mix={s['height_mix']}",
                flush=True,
            )
            if s["notes"]:
                print(f"  notes: {s['notes']}", flush=True)
        except Exception:  # noqa: BLE001 - one place failing must not sink the batch
            print(f"  FAILED {p.slug}:\n{traceback.format_exc()}", flush=True)
    if summaries:
        _write_index(summaries)
        print(f"wrote index.json + benchmark.json ({len(summaries)} places) -> {DERIVED}", flush=True)
    return summaries


def main() -> None:
    ap = argparse.ArgumentParser(prog="maquetalab.pipeline")
    ap.add_argument("place", nargs="?", default=None, help="a place slug, or omit for a set")
    ap.add_argument("--tier", choices=["A", "B", "C"], help="bake only this tier")
    ap.add_argument("--fetched", required=True, help="ISO date for provenance (e.g. 2026-07-12)")
    args = ap.parse_args()

    if args.place:
        selected = [places.get_place(args.place)]
    elif args.tier:
        selected = [p for p in places.list_places() if p.tier == args.tier]
    else:
        selected = places.list_places()
    run(selected, fetched=args.fetched)


if __name__ == "__main__":
    main()
