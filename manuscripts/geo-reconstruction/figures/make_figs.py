#!/usr/bin/env python3
"""Regenerate the figures for the Maqueta geospatial-reconstruction report from the COMMITTED benchmark. Two figures:

  fig-provenance.pdf - the honest height provenance across 118 fused places: what fraction of building heights are
                       measured versus floor-count-inferred, raster-derived or a prior. Most are inferred.
  fig-benchmark.pdf  - where authoritative LoD2 ground truth exists (two Dutch places), the fused-height error:
                       RMSE, MAE and (signed) bias against the LoD2 reference.

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
    "font.family": "serif", "font.size": 9.4, "axes.edgecolor": INK,
    "axes.labelcolor": INK, "text.color": INK, "xtick.color": INK, "ytick.color": INK,
    "axes.linewidth": 0.8, "figure.dpi": 200,
})


def _load():
    return json.loads((DATA / "mq.json").read_text(encoding="utf-8"))


def fig_provenance():
    d = _load()
    mix = d["global_mix"]
    order = ["measured", "floors", "raster", "prior"]
    labels = ["measured\n(authoritative)", "floor-count\ninferred", "raster\n(DSM-derived)", "prior\n(assumed)"]
    vals = [100 * mix[k] for k in order]
    cols = ["#3fa34d", "#c99a1e", "#e07a3f", "#b23a48"]
    fig, ax = plt.subplots(figsize=(6.2, 3.1))
    bars = ax.bar(range(4), vals, color=cols, edgecolor=INK, linewidth=0.6, width=0.64, zorder=3)
    for i, v in enumerate(vals):
        ax.text(i, v + 1, f"{v:.1f}%", ha="center", va="bottom", fontsize=9.0, fontweight="bold")
    ax.set_ylabel("share of building heights (%)")
    ax.set_xticks(range(4)); ax.set_xticklabels(labels, fontsize=8.0)
    ax.set_ylim(0, max(vals) * 1.18)
    ax.set_title(f"Open-data 3D city heights are mostly inferred, not measured\n"
                 f"({d['n_places']} places; only {vals[0]:.1f}% authoritative)", fontsize=9.0)
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
    names = [g["name"] for g in gt]
    rmse = [g["rmse"] for g in gt]
    mae = [g["mae"] for g in gt]
    bias = [abs(g["bias"]) for g in gt]
    x = np.arange(len(gt)); w = 0.26
    fig, ax = plt.subplots(figsize=(6.0, 3.1))
    ax.bar(x - w, rmse, w, color="#1b6ca8", edgecolor=INK, linewidth=0.5, label="RMSE")
    ax.bar(x, mae, w, color="#3fa34d", edgecolor=INK, linewidth=0.5, label="MAE")
    ax.bar(x + w, bias, w, color="#e07a3f", edgecolor=INK, linewidth=0.5, label="|bias|")
    for xi, r, m, b, g in zip(x, rmse, mae, bias, gt):
        ax.text(xi - w, r + 0.15, f"{r:.1f}", ha="center", va="bottom", fontsize=7.2)
        ax.text(xi + w, b + 0.15, f"{g['bias']:+.1f}", ha="center", va="bottom", fontsize=7.0, color="#c15a22")
    ax.set_xticks(x)
    ax.set_xticklabels([f"{g['name']}\n({g['country']}, n={g['n_truth']})" for g in gt], fontsize=7.6)
    ax.set_ylabel("building-height error (m)")
    ax.set_title("Fused-height error vs authoritative LoD2, where it exists\n"
                 "(only 2 of 118 places have public LoD2 ground truth)", fontsize=8.8)
    ax.grid(axis="y", color=GRID, linewidth=0.7, zorder=0)
    ax.set_axisbelow(True)
    ax.legend(fontsize=7.8, frameon=True, facecolor="white", edgecolor=GRID, loc="upper right")
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
