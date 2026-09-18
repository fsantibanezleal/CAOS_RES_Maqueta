# Architecture

- [01, overview](architecture/01_overview.md): the three parts, what runs where, a place's path from sources to screen
- [02, reproducibility and provenance](architecture/02_determinism-and-trace.md)
- [03, why every scene is baked offline](architecture/03_the-gate.md)
- [04, what the browser computes](architecture/04_live-lane-pyodide.md)
- [05, the bake pipeline](architecture/05_precompute-pipeline.md)
- [06, evaluation: height provenance and the LoD2 benchmark](architecture/06_model-evaluation.md)
- [07, deploy and CI](architecture/07_deploy.md)
- [08, the two data contracts](architecture/08_data-contracts.md)
- [09, the analytical layers (satellite, environment, socio-economic)](architecture/09_analytical-layers.md)

Maqueta is an instance of the CAOS product-repo archetype (ADR-0057): an offline-pipeline-heavy product that
deploys as a static replay. The file names keep the archetype's numbered slots; the pages describe this
product.
