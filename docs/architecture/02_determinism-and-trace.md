# 02, reproducibility and provenance

Maqueta's inputs are live public services, so a bake is not a pure function of the code: Overture
publishes new releases, OpenStreetMap is edited every day, and a least-cloud Sentinel-2 search can return
a newer scene. Reproducibility therefore rests on the committed bundles and the provenance each one
carries, plus one part that is fully deterministic and checked on every push.

## What a bundle records

Each `data/derived/<slug>/manifest.json` (geoscena's `SceneBundle.to_manifest`) records, for every layer,
the source, URL, license key and name, whether commercial use is allowed, the fetch date given as
`--fetched`, the access method (for example "overturemaps CLI bbox extract of GeoParquet on S3") and
source-specific extras (the Overture release, `2026-06-17.0` in the current bake). The manifest also holds
the scene `credits`, the per-building `modalities` (source and license of NDVI / NDWI / NDBI and soil
carbon, including the exact Sentinel-2 scene id and date), the `environment` sources, the height-provenance
mix and free-text `notes` saying what was skipped and why. A bundle is the record of what was fetched on
that date; the manifest is Maqueta's trace.

## What is deterministic

`index.json` and `benchmark.json` are a pure function of the committed bundles and the registry.
`python data-pipeline/run.py regen-index` rebuilds them from disk, and CI runs
`python data-pipeline/run.py regen-index --check`, which fails unless the committed files equal the regeneration
exactly (read in text mode, so a CRLF checkout compares equal). The property also holds right after a bake,
because the pipeline writes the index only through `regen_index`, after compression.

## What is not

A re-bake of the same place on a later date can differ: a new Overture release, OpenStreetMap edits,
another Sentinel-2 scene, or a service that was unavailable (recorded in `notes`). Comparing the manifests
of two bakes shows which sources moved.
