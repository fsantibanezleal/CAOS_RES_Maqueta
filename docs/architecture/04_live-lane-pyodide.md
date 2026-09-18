# 04, what the browser computes (there is no Pyodide lane)

The app loads `data/index.json`, then the selected place's `manifest.json` and the `.glb` layers it names
(Three.js `GLTFLoader` with the meshopt decoder), and `admin.json` when the place has sub-areas. All the
interaction then runs in TypeScript over the per-building attributes baked into the glTF extras
(`frontend/src/render/MaquetaScene.ts`):

| Feature | How |
|---|---|
| Colour by attribute | `setColorMode` over height, height provenance, floors, footprint area, function (Overture use), land-cover class, soil carbon and the Sentinel-2 indices; an attribute with no data at a place is not offered. |
| Filters | `setNumericFilter` (ranges) and `setCategoricalFilter` (chips), combined. |
| Selection | Raycast picking on the per-vertex `_featureid`, then the building's fused attributes in a panel. |
| Area statistics | `computeAreaStats`: point-in-polygon of footprint centroids inside a drawn polygon or the whole place, then count, polygon and footprint area, built cover, density, built-volume proxy, height mean / median / p90 / max, floors, and height, function, land-cover and provenance mixes. |
| Aggregate by admin area | `loadAdmin` assigns each building to its unit by point-in-polygon; `adminStats` and `setAdminChoropleth` rank and colour units by a building average, an environment value or a Chilean indicator. |
| Satellite drape | `setTerrainImagery`: an optional EOX Sentinel-2 cloudless WMS image over the terrain, requested at run time. |

The pulse animation is off by default and stops while the tab is hidden. Nothing here changes the bundles;
reloading a place gives the same scene.
