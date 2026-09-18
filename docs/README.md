# Docs, the Maqueta wiki

How Maqueta turns open public geodata into 3D places you can interrogate, how the repository is organised,
and how to run, check and extend it. Numbers quoted here are read from the committed bundles in
`data/derived/` or from the code, not estimated.

## Map

- **[architecture](architecture.md)**: the parts and the flow, reproducibility and provenance, why every
  scene is baked offline, what the browser computes, the bake pipeline, evaluation, deploy and CI, the two
  data contracts, the analytical layers.
- **[cases](cases/README.md)**: the 118 places, their tiers and what each bundle contains.
- **[frameworks](frameworks.md)**: the engines and libraries the pipeline and the app use, with versions.
- **[guides](guides.md)**: set up, bake, add a place, run the checks, build and deploy the web app, the
  in-app architecture modal.

## Data and honesty policy

- Every layer in a bundle carries its source, license, fetch date and access method, and every building
  carries the rung its height came from (measured, floors, raster, prior); measured and inferred heights
  are never merged into one number. The one known gap is listed in
  [architecture/08](architecture/08_data-contracts.md).
- Gaps are recorded, not filled: a source that failed or does not cover a place leaves a note in the
  manifest (`stats.notes`), never an invented value.
- The baked bundles are committed; raw downloads stay outside git in the fetch cache.
