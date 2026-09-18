# 06, evaluation: height provenance and the LoD2 benchmark

Maqueta trains no model. What it evaluates is how much of each reconstruction is measured, and how close the
fused heights come to authoritative ones where those exist. Both are baked into
`data/derived/benchmark.json` by `maquetalab.benchmark` and shown on the Benchmark page; the figures below
are read from that file and from the manifests.

## Height provenance, every building of every place

Each baked building records the rung its height came from ([05](05_precompute-pipeline.md)). Across the
118 places, 4,053,338 buildings:

| Rung | Buildings | Share |
|---|---:|---:|
| `measured`: a mapped height attribute | 357,732 | 8.8% |
| `floors`: floor count times a storey height | 259,616 | 6.4% |
| `raster`: Google Open Buildings 2.5D | 2,965,164 | 73.2% |
| `prior`: a default height | 470,826 | 11.6% |

The per-place mix varies widely, which is the point of recording it: Delft is 0.3% measured, 41.2% floors,
58.5% prior; Providencia (Santiago) is 80.6% raster.

## LoD2 benchmark, where authoritative heights exist

Two places have open LoD2 reference heights wired in, both from the 3D BAG (TU Delft) in the Netherlands.
From each manifest's `stats.ground_truth`:

| Place | Reference buildings | Fused buildings | Matched | Coverage | RMSE | MAE | Bias |
|---|---:|---:|---:|---:|---:|---:|---:|
| Delft | 397 | 15,923 | 2,722 | 17.1% | 3.06 m | 2.47 m | -0.13 m |
| Amsterdam Centrum | 50 | 14,374 | 143 | 1.0% | 8.32 m | 7.48 m | -6.57 m |

Coverage is matched over fused buildings. Neither place uses the raster rung (0 raster heights in both),
so the Open Buildings 2.5D heights, 73.2% of all heights, have no ground-truth check in this repository.
The other eight tier-A places have open LoD2 or lidar available but no reference wired in yet.

## What this is not

The scenes are for visualisation, teaching and planning context, not survey-grade models: more than nine
in ten heights are inferred, and the benchmark covers two Dutch cities. The published technical report
([manuscripts/geo-reconstruction](../../manuscripts/geo-reconstruction/)) discusses both.
