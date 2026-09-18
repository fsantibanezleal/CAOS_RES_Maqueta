# Frameworks

The engines and libraries Maqueta depends on, where each is used, and the version in use. One card per
engine (`frameworks/<NN>_<tool>/<tool>.md`, from [the card template](frameworks/00_TEMPLATE.md)) is the
target; none is written yet.

## Offline bake (Python)

| Engine | Used for | Version |
|---|---|---|
| geoscena ([CAOS_GeoScena](https://github.com/fsantibanezleal/CAOS_GeoScena)) | fetching, per-building fusion and the height ladder, terrain / building / road meshing, the SceneBundle and its manifest | commit `ab0bbf8` (2026-07-14), the source the committed bundles match; newer than the 0.1.0 release on PyPI (`data-pipeline/requirements-bake.txt`) |
| overturemaps (CLI) | Overture buildings and transportation, bounding-box extracts from GeoParquet on S3 | through geoscena's `overture` extra |
| OSMnx | OpenStreetMap water, green and rail | through geoscena's `osm` extra |
| rasterio (GDAL) | windowed `/vsicurl` reads of GLO-30, GHS-POP, Open Buildings 2.5D and Sentinel-2 | a geoscena dependency |
| shapely, pyproj, geopandas, scipy, trimesh, mapbox-earcut, numpy | geometry, projection to the local metric frame, triangulation and meshing | geoscena dependencies |
| geopandas, requests, shapely | `gen_admin`: geoBoundaries units, clipping, the environment calls | geoscena dependencies, installed with it |
| numpy | the pipeline lane, the only engine dependency CI needs | 2.4.6 (`data-pipeline/requirements.txt`) |

## Bundle compression (Node, `data-pipeline/tools/package-lock.json`)

| Library | Used for | Version |
|---|---|---|
| @gltf-transform/core, /extensions, /functions | read, transform and write the `.glb` layers | 4.4.1 |
| meshoptimizer | the `EXT_meshopt_compression` encoder | 0.22.0 |

## Web app (`frontend/package-lock.json`)

| Library | Used for | Version |
|---|---|---|
| three | rendering; `GLTFLoader` with the meshopt decoder | 0.171.0 |
| react, react-dom | the UI | 19.2.7 |
| @fasl-work/caos-app-shell | the shared shell: navigation, EN/ES, light/dark, the architecture modal | 0.3.0 |
| katex | the equations on the Methodology page | 0.16.47 |
| uplot | declared in `package.json` but not imported by the app today | 1.6.32 |
| vite, typescript | build and type check | 6.4.3, 5.9.3 |
