# 09, the analytical layers (satellite, environment, socio-economic)

The geometric fusion (buildings, roads, terrain, land cover, population) gives the scene its bones. The
*analytical* layers make it a tool you can interrogate: infer vegetation/water/built-up from satellite,
attach the solar-energy and climate context of the place, and join Chilean socio-economic indicators to
the comunas so any of them can be filtered, coloured, and aggregated by sub-area. Every layer here is an
open, no-auth source, sampled with recorded provenance; nothing is fabricated, and gaps are recorded, not
faked.

## 1. Satellite multispectral indices (per building)

`geoscena.fetch.sentinel2` finds the least-cloudy recent **Sentinel-2 L2A** scene over the AOI through the
AWS Earth Search STAC API (`earth-search.aws.element84.com/v1`, no auth), windowed-reads the visible +
red-edge + NIR + SWIR bands from the `sentinel-cogs` COGs via `/vsicurl`, reprojects them to a WGS84 grid
over the AOI, and derives three normalised-difference indices, each sampled at every building's footprint
centroid:

```math
\mathrm{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}}
\qquad
\mathrm{NDWI} = \frac{\rho_{\text{Green}} - \rho_{\text{NIR}}}{\rho_{\text{Green}} + \rho_{\text{NIR}}}
\qquad
\mathrm{NDBI} = \frac{\rho_{\text{SWIR}} - \rho_{\text{NIR}}}{\rho_{\text{SWIR}} + \rho_{\text{NIR}}}
```

with Sentinel-2 bands B04 (Red), B03 (Green), B08 (NIR, 10 m) and B11 (SWIR, 20 m). NDVI tracks
vegetation vigour, NDWI open water / moisture, NDBI built-up / impervious surface. Because they ride as
per-building attributes, they are colour-by, filter, and aggregate-by-comuna layers exactly like height or
floor count. A true-colour (B04/B03/B02) and false-colour (B08/B04/B03) composite are also produced for
the optional terrain drape.

- **Access**: STAC `POST /search` (collection `sentinel-2-l2a`, sort by `eo:cloud_cover`), then windowed
  COG read with `AWS_NO_SIGN_REQUEST=YES`, `GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR`.
- **License**: Copernicus Sentinel data, free and open ("contains modified Copernicus Sentinel data").
- **Caveats**: a single-date scene, so a cloud over one block leaves a few centroids `null` (recorded, not
  interpolated); indices are surface proxies, not calibrated biophysical variables; the 10-20 m footprint
  means a small building samples the reflectance of its block, not its roof alone.

## 2. Environment: solar potential + climate normals (per place, per comuna)

`geoscena.fetch.environment` attaches the geophysical context of the place. Unlike the satellite indices,
solar and climate are near-constant across a few-kilometre AOI, so they are recorded once per place (the
manifest `environment` block) and re-sampled at each comuna centroid in `gen_admin`, where they *do* vary
meaningfully (Atacama vs Patagonia, Vitacura vs the valley floor) and become an aggregate-by-sub-area
layer.

| Key | Source | Meaning |
|---|---|---|
| `solar_pvout` | PVGIS v5.3 `PVcalc` | grid-connected 1 kWp fixed-mount yearly PV yield, kWh/kWp/yr |
| `solar_ghi` | PVGIS v5.3 | annual global horizontal irradiation, kWh/m2/yr |
| `temp_mean` / `temp_min` / `temp_max` | Open-Meteo ERA5 archive | 2023 daily-mean temperature: annual mean, coldest day, warmest day, degC |
| `wind_max_mean` | Open-Meteo ERA5 archive | mean of the 2023 daily 10 m maximum wind, km/h |
| `precip_annual` | Open-Meteo ERA5 archive | 2023 total precipitation, mm/yr |

- **Access**: both are plain no-auth JSON GETs (PVGIS `re.jrc.ec.europa.eu/api/v5_3/PVcalc`; Open-Meteo
  `archive-api.open-meteo.com/v1/archive`), cheap enough to also call per comuna centroid.
- **License**: PVGIS free with attribution to the EC JRC; Open-Meteo CC-BY-4.0 over ERA5 (Copernicus).
- **Sanity checks**: Chuquicamata (Atacama) `solar_pvout` ~2024 kWh/kWp, the highest in the set; Chicago
  `wind_max_mean` ~24.8 km/h; Santiago `precip_annual` ~505 mm. These match known climatology.
- **Caveats**: ERA5 is ~25 km, so within one city the values are a single climatological point, not a
  gradient; `wind_max_mean` is a proxy for windiness (mean of daily maxima), not a mean wind speed; a
  single year (2023), not a 30-year normal.

## 3. Socio-economic indicators: the Chilean Data Observatory (per comuna)

`maquetalab.do_indicators` reduces datasets from the Data Observatory (Atalaya mirror of datos.gob.cl) to
one scalar per comuna, joined to the geoBoundaries comunas by accent- and case-normalised name:

| Indicator | Source | Coverage |
|---|---|---|
| `health_facilities` | MINSAL operating health establishments (2025) | 345 comunas |
| `foreign_pop` | INE estimated foreign-born residents (base 2022) | 43 comunas (major) |
| `schools` | MINEDUC official education-establishment directory | 346 comunas |

- **Join**: comuna name normalised (uppercase, accents stripped, whitespace collapsed) on both sides,
  because geoBoundaries carries the name, not the CUT code. Comunas with no match are simply absent for
  that indicator, never zero-filled.
- **License**: Chilean public-sector open data (datos.gob.cl).
- **Caveats**: a name join is fragile where two comunas share a name across regions (rare in the Santiago
  set); `foreign_pop` covers only the larger comunas; counts are snapshots of different years and are not
  normalised by population or area here (they are raw counts, honestly labelled as such).

## 4. Aggregation by admin sub-area

`gen_admin` writes, per place with two or more comunas, an `admin.json` of the geoBoundaries comuna
polygons (clipped to the AOI, in the local metric frame) plus each unit's `env` and `indicators`. The app
assigns every building to its comuna by bbox-culled point-in-polygon over the footprint centroid, then the
**Aggregate by admin area** tool offers three bands:

1. **Building averages**, the mean over the buildings in each comuna of a per-building attribute (height,
   floors, footprint area, NDVI, NDWI, NDBI).
2. **Environment (solar / climate)**, the per-comuna scalar sampled at the comuna centroid.
3. **Data Observatory (Chile)**, the joined socio-economic indicator.

Any of the three colours every building by its comuna's value (a choropleth over `heightRamp`), draws the
comuna outlines, and fills a ranked table. Building averages need at least one building in the comuna;
unit-level layers (environment, indicators) render for every comuna that carries a value, even one clipped
to a sliver of the AOI.

## Sources

- Sentinel-2 L2A on AWS Open Data via Earth Search STAC: <https://earth-search.aws.element84.com/v1>
- PVGIS v5.3 (EC JRC): <https://re.jrc.ec.europa.eu/pvg_tools/>
- Open-Meteo ERA5 archive: <https://open-meteo.com/en/docs/historical-weather-api>
- geoBoundaries (gbOpen, CC-BY): <https://www.geoboundaries.org/>
- Chile Data Observatory: <https://datos.gob.cl/>
