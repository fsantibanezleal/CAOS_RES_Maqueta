# Changelog

All notable changes to Maqueta. Format: [Keep a Changelog](https://keepachangelog.com/); versions use
`X.XX.XXX` (display). `0.x` while the place set and API stabilize. Tag every release.

## [0.01.000] - 2026-07-13

### Added
- Instantiated from the CAOS product-repo template (ADR-0057); package renamed `examplelab` -> `maquetalab`.
- `maquetalab` pipeline over the `geoscena` core: the 40-place tiered registry (`places.py`), the bake
  wrapper (`build.py`), the orchestrator + CLI (`pipeline.py`), and the cross-place benchmark (`benchmark.py`).
- Frontend (React + Three.js over `@fasl-work/caos-app-shell`): the App workbench (place selector + 3D
  viewer with Fresnel/neon/bloom shader identity, raycast building read-out of height + provenance, layer
  toggles, camera presets, paused-by-default animation), plus Introduction / Methodology (KaTeX) /
  Implementation / Experiments / Benchmark pages, the ADR-0058 architecture modal (5 themed SVG diagrams),
  EN/ES i18n and light/dark theming.
- CONTRACT-2 TypeScript mirror of the SceneBundle manifest (`contract.types.ts`).
- First place baked end-to-end and verified on real data: Berlin Mitte (terrain + buildings + roads +
  water + green + rail), height provenance mix reported.

[0.01.000]: https://github.com/fsantibanezleal/CAOS_RES_Maqueta/releases/tag/v0.01.000
