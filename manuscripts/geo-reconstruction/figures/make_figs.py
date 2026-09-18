#!/usr/bin/env python3
"""Regenerate the figures for the Maqueta geospatial-reconstruction report from the repository benchmark
(data/derived/benchmark.json, copied into ../data/mq.json). Two figures, drawn at single-column width:

  fig-provenance.pdf - the height provenance of the 4.05 million buildings of the 118 baked places: the share whose
                       height comes from a mapped height attribute (OpenStreetMap / Overture), from a mapped floor
                       count, from the Google Open Buildings 2.5D height raster, or from the default prior.
  fig-benchmark.pdf  - where a public LoD2 reference exists (two Dutch places, 3D BAG), the fused-height RMSE, MAE and
                       signed bias against it, with the number of reference buildings and of matched fused buildings.

Run:  python make_figs.py     (from repo root)
Deps: matplotlib, numpy.
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"

INK = "#1a1a2e"
GRID = "#d8d8e0"

plt.rcParams.update({
    "font.family": "serif", "font.size": 8.0, "axes.edgecolor": INK,
    "axes.labelcolor": INK, "text.color": INK, "xtick.color": INK, "ytick.color": INK,
    "axes.linewidth": 0.8, "figure.dpi": 200,
})


def _load():
    return json.loads((DATA / "mq.json").read_text(encoding="utf-8"))


def fig_provenance():
    d = _load()
    mix = d["global_mix"]
    order = ["measured", "floors", "raster", "prior"]
    labels = ["mapped\nheight\n(OSM, Overture)", "mapped floor\ncount\n× 3.2 m", "Open Buildings\n2.5D height\nraster",
              "default\nprior\n(8 m)"]
    vals = [100 * mix[k] for k in order]
    cols = ["#3fa34d", "#c99a1e", "#e07a3f", "#b23a48"]
    fig, ax = plt.subplots(figsize=(3.45, 2.6))
    ax.bar(range(4), vals, color=cols, edgecolor=INK, linewidth=0.6, width=0.64, zorder=3)
    for i, v in enumerate(vals):
        ax.annotate(f"{v:.1f}%", (i, v), xytext=(0, 2), textcoords="offset points", ha="center", va="bottom",
                    fontsize=7.6, fontweight="bold")
    ax.set_ylabel("share of building heights (%)")
    ax.set_xticks(range(4)); ax.set_xticklabels(labels, fontsize=6.6)
    ax.set_ylim(0, max(vals) * 1.15)
    ax.set_title(f"Height provenance, {d['n_places']} places\n({d['n_buildings'] / 1e6:.2f} million buildings)",
                 fontsize=7.8)
    ax.grid(axis="y", color=GRID, linewidth=0.7, zorder=0)
    ax.set_axisbelow(True)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(HERE / "fig-provenance.pdf", bbox_inches="tight")
    plt.close(fig)


def fig_benchmark():
    d = _load()
    gt = d["ground_truth"]
    rmse = [g["rmse"] for g in gt]
    mae = [g["mae"] for g in gt]
    bias = [abs(g["bias"]) for g in gt]
    x = np.arange(len(gt)); w = 0.26
    fig, ax = plt.subplots(figsize=(3.45, 2.6))
    ax.bar(x - w, rmse, w, color="#1b6ca8", edgecolor=INK, linewidth=0.5, label="RMSE", zorder=3)
    ax.bar(x, mae, w, color="#3fa34d", edgecolor=INK, linewidth=0.5, label="MAE", zorder=3)
    ax.bar(x + w, bias, w, color="#e07a3f", edgecolor=INK, linewidth=0.5, label="|bias|", zorder=3)
    for xi, r, m, b, g in zip(x, rmse, mae, bias, gt):
        ax.annotate(f"{r:.1f}", (xi - w, r), xytext=(0, 2), textcoords="offset points", ha="center", va="bottom",
                    fontsize=6.8)
        ax.annotate(f"{m:.1f}", (xi, m), xytext=(0, 2), textcoords="offset points", ha="center", va="bottom",
                    fontsize=6.8)
        ax.annotate(f"{g['bias']:+.1f}", (xi + w, b), xytext=(0, 2), textcoords="offset points", ha="center",
                    va="bottom", fontsize=6.8, color="#c15a22")
    ax.set_xticks(x)
    ax.set_xticklabels([f"{g['name']}\n{g['n_truth']} reference,\n{g['matched']} matched" for g in gt], fontsize=6.8)
    ax.set_ylabel("building-height error (m)")
    ax.set_ylim(0, max(rmse) * 1.2)
    ax.set_title("Fused heights against 3D BAG LoD2", fontsize=7.8)
    ax.grid(axis="y", color=GRID, linewidth=0.7, zorder=0)
    ax.set_axisbelow(True)
    ax.legend(fontsize=6.8, frameon=True, facecolor="white", edgecolor=GRID, loc="upper right")
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(HERE / "fig-benchmark.pdf", bbox_inches="tight")
    plt.close(fig)


def main():
    fig_provenance()
    fig_benchmark()
    print("wrote fig-provenance.pdf, fig-benchmark.pdf")


if __name__ == "__main__":
    main()
