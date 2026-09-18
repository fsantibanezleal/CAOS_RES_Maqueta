# Cases: the 118 places

A case is a place: an area of interest in `data-pipeline/pipeline/places.py` (slug, centre, half-size,
hierarchy, a note), baked into one bundle under `data/derived/<slug>/`. The tier is the category; it says
what kind of evidence a place can offer. Counts below are read from `data/derived/index.json` and the
manifests; `tests/test_registry_and_benchmark.py` fails if the registry and the index ever name different places.

## Tiers

| Tier | Category | Places | What it tests |
|---|---|---:|---|
| A | ground-truth | 10 | cities with open LoD2 or lidar, where fused heights can be compared with authoritative ones (wired in for Delft and Amsterdam so far, see [architecture/06](../architecture/06_model-evaluation.md)) |
| B | global-fusion city | 90 | cities reconstructed from the global sources, heights through the provenance ladder |
| C | terrain-first area | 18 | mines, deserts, mountains and landmarks where the terrain carries the scene; buildings and roads are not fetched |

Tier B holds several groups: the 37 Gran Santiago comunas, each its own case; 12 metro cores (the Santiago
core, `santiago_full`, and 11 world metro cores with a 4.5 km half-size sized to span official sub-areas:
New York, London, Paris, Berlin, Barcelona, Tokyo, Seoul, Delhi, Mexico City, Buenos Aires, Sao Paulo);
Santiago Centro; 4 landmark cities (Agra, Rio de Janeiro, Venice, Santorini); and 36 other cities.

## Coverage

38 countries, 49 places in Chile.

| Continent | A | B | C | Total |
|---|---:|---:|---:|---:|
| South America | 0 | 52 | 5 | 57 |
| Europe | 6 | 13 | 2 | 21 |
| Asia | 2 | 13 | 5 | 20 |
| North America | 2 | 7 | 3 | 12 |
| Africa | 0 | 4 | 2 | 6 |
| Oceania | 0 | 1 | 1 | 2 |
| **Total** | **10** | **90** | **18** | **118** |

## What a bundle contains

Layers per place, not counting the `buildings_lite` level-of-detail proxy (present at 25 large places):

| Layers | Places | Typically |
|---:|---:|---|
| 1 | 2 | terrain only (Mont Blanc, Torres del Paine) |
| 2 | 16 | terrain + population (the other tier-C places) |
| 4 | 74 | terrain, buildings, roads, population |
| 6 | 5 | the above with two of the OpenStreetMap context layers |
| 7 | 19 | the above with water, green and rail |
| 8 | 2 | the above with the LoD2 reference layer (Delft, Amsterdam Centrum) |

All 100 places with buildings carry the Sentinel-2 indices per building; 71 carry soil organic carbon; 68
have an `admin.json` for aggregation by sub-area; every place has the solar and climate environment block.

## Per-place pages

There are none: each place is described by its registry note and its manifest, and the App shows its
layers, provenance and notes directly.
