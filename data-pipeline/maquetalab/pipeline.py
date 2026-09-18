"""The offline pipeline orchestrator + CLI (ADR-0057).

Bakes one place or all places into committed SceneBundles, meshopt-compresses them, then regenerates
the place index + benchmark summary that the web app reads from every bundle on disk (regen_index is
the single writer, so the recorded byte sizes are the compressed ones and a one-place bake keeps the
places baked earlier in the index).

    python -m maquetalab.pipeline --fetched 2026-07-12                 # all places
    python -m maquetalab.pipeline berlin_mitte --fetched 2026-07-12    # one place
    python -m maquetalab.pipeline --tier A --fetched 2026-07-12        # one tier
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import traceback
from pathlib import Path

from . import places, regen_index
from .build import DERIVED, bake_place

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parents[1] / "tools"


def compress_bundles() -> None:
    """Delivery-layer meshopt compression of every baked .glb (see tools/compress-bundles.mjs).

    geoscena emits uncompressed GLB by design; the product owns web-delivery compression. This is
    lossless for the `_featureid` picking attribute and preserves per-building `extras.features`.
    Silent skip (with a warning) if the node toolchain is unavailable so a bake never hard-fails on it.
    """
    node = shutil.which("node")
    script = TOOLS / "compress-bundles.mjs"
    if not node or not script.exists() or not (TOOLS / "node_modules").exists():
        print("  (skip compress: node / tools/node_modules / script missing; run `npm install` in "
              f"{TOOLS} to enable)", flush=True)
        return
    print("compressing bundles (meshopt) ...", flush=True)
    subprocess.run([node, str(script), str(DERIVED)], cwd=str(TOOLS), check=False)


def reindex() -> None:
    """Rewrite index.json + benchmark.json from every bundle on disk (regen_index is the single writer).

    Called after compression, because meshopt changes the .glb sizes the index records, and never from
    the in-memory summaries of one bake, which would drop every place not baked in this run.
    """
    n = regen_index.write()
    print(f"wrote index.json + benchmark.json ({n} places) -> {DERIVED}", flush=True)


def run(selected: list[places.Place], fetched: str) -> list[dict]:
    """Bake the selected places; returns the per-place summaries (the index is written by reindex)."""
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
    return summaries


def _run_cli(selected: list[places.Place], fetched: str, compress: bool) -> None:
    summaries = run(selected, fetched=fetched)
    if compress:
        compress_bundles()
    if summaries:
        reindex()


def main() -> None:
    ap = argparse.ArgumentParser(prog="maquetalab.pipeline")
    ap.add_argument("place", nargs="?", default=None, help="a place slug, or omit for a set")
    ap.add_argument("--tier", choices=["A", "B", "C"], help="bake only this tier")
    ap.add_argument("--fetched", required=True, help="ISO date for provenance (e.g. 2026-07-12)")
    ap.add_argument("--no-compress", action="store_true",
                    help="skip the meshopt delivery-compression step after baking")
    ap.add_argument("--compress-only", action="store_true",
                    help="skip baking; only run meshopt compression over existing bundles")
    args = ap.parse_args()

    if args.compress_only:
        compress_bundles()
        reindex()  # compression changed the .glb sizes the index records
        return

    if args.place:
        selected = [places.get_place(args.place)]
    elif args.tier:
        selected = [p for p in places.list_places() if p.tier == args.tier]
    else:
        selected = places.list_places()
    _run_cli(selected, fetched=args.fetched, compress=not args.no_compress)


if __name__ == "__main__":
    main()
