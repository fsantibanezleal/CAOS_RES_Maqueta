# 03, why every scene is baked offline

The archetype lets a case run live in the browser (Pyodide) when a measured gate says it is pure Python,
fast and small. No Maqueta place would pass that gate, so Maqueta has no gate and no live lane: every
place is baked offline and the browser replays the result.

- **Network**: a bake reads cloud-optimised rasters through GDAL (`/vsicurl` windowed reads of GLO-30,
  GHS-POP, Open Buildings and Sentinel-2), extracts a bounding box from Overture's GeoParquet on S3, queries
  OpenStreetMap through Overpass, and calls the Sentinel-2 STAC catalogue, PVGIS and Open-Meteo. Several of
  these take minutes, and none belongs in a page load.
- **Dependencies**: the fetchers and the mesher run on rasterio (GDAL), shapely, pyproj, trimesh and
  mapbox-earcut; the bake runs where those and the network are available, on the maintainer's machine.
- **Size**: the committed bundles hold 1,783.5 MB of GLB for 118 places (`benchmark.json`, `total_mb`),
  up to 87.2 MB for one place (`sao_paulo_full`). A replay of baked files is the only way to show them at
  interactive speed.

What the browser does compute, interactively and over the baked attributes, is in
[04](04_live-lane-pyodide.md).
