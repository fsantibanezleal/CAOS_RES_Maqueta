"""Generate admin.json (comuna/district/state boundaries) for every place that has buildings.

Boundaries come from geoBoundaries (gbOpen, CC-BY, no-auth REST) per country - reliable, unlike Overpass.
For each place we take the country's finest admin level with >=2 units intersecting the AOI (ADM3 -> ADM2 ->
ADM1), clip to the AOI, and write the unit boundaries in the local world frame (x=east m, z=-north m) so the
frontend point-in-polygons building centroids against it directly.

Run AFTER a full bake (writing into each bundle dir):  python -m maquetalab.gen_admin
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import geopandas as gpd
import requests
from shapely.geometry import box

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "CAOS_GeoScena" / "src"))
from geoscena.aoi import AOI  # noqa: E402

from maquetalab import places as places_mod  # noqa: E402

DERIVED = Path(__file__).resolve().parents[1] / "data" / "derived"
GEOB = "https://www.geoboundaries.org/api/current/gbOpen/{iso3}/{adm}/"

# Country name (registry) -> ISO3 for geoBoundaries.
ISO3 = {
    "Chile": "CHL", "Germany": "DEU", "Netherlands": "NLD", "USA": "USA", "Finland": "FIN",
    "Switzerland": "CHE", "Austria": "AUT", "Singapore": "SGP", "Japan": "JPN", "UK": "GBR",
    "Spain": "ESP", "France": "FRA", "Argentina": "ARG", "Mexico": "MEX", "Brazil": "BRA",
    "Kenya": "KEN", "India": "IND", "South Korea": "KOR", "Australia": "AUS", "Canada": "CAN",
    "Turkey": "TUR", "Egypt": "EGY", "Russia": "RUS", "Italy": "ITA", "Portugal": "PRT",
    "South Africa": "ZAF", "Colombia": "COL", "China": "CHN", "Thailand": "THA", "Indonesia": "IDN",
    "UAE": "ARE", "Nigeria": "NGA", "Peru": "PER", "Jordan": "JOR", "Cambodia": "KHM",
    "Greece": "GRC", "Zimbabwe": "ZWE", "Vietnam": "VNM", "Hong Kong": "HKG",
}
LEVELS = ["ADM3", "ADM2", "ADM1"]

_cache: dict[str, gpd.GeoDataFrame | None] = {}


def _load_country(iso3: str, adm: str) -> gpd.GeoDataFrame | None:
    key = f"{iso3}/{adm}"
    if key in _cache:
        return _cache[key]
    try:
        meta = requests.get(GEOB.format(iso3=iso3, adm=adm), timeout=40).json()
        gj = meta.get("gjDownloadURL")
        gdf = gpd.read_file(gj) if gj else None
    except Exception:
        gdf = None
    _cache[key] = gdf
    return gdf


def _units_for(aoi: AOI, gdf: gpd.GeoDataFrame) -> list[dict]:
    w, s, e, n = aoi.bbox
    aoibox = box(w, s, e, n)
    namecol = "shapeName" if "shapeName" in gdf.columns else gdf.columns[0]
    sel = gdf[gdf.intersects(aoibox)]
    units: list[dict] = []
    for _, row in sel.iterrows():
        g = row.geometry.intersection(aoibox)
        if g.is_empty:
            continue
        rings = []
        for p in getattr(g, "geoms", [g]):
            if not hasattr(p, "exterior") or p.exterior is None:
                continue
            xs, ys = p.exterior.coords.xy
            east, north = aoi.to_local(list(xs), list(ys))
            rings.append([[float(x), float(-z)] for x, z in zip(east, north)])
        if rings:
            units.append({"name": str(row[namecol]), "rings": rings})
    return units


def gen_for_place(p) -> int:
    d = DERIVED / p.slug
    man = d / "manifest.json"
    if not man.exists():
        return -1
    layers = {l["name"] for l in json.loads(man.read_text(encoding="utf-8")).get("layers", [])}
    if "buildings" not in layers:  # only places with buildings can be aggregated by sub-area
        return -1
    iso3 = ISO3.get(p.country)
    if not iso3:
        return -1
    aoi = AOI.from_center(p.slug, p.lon, p.lat, p.half_size_m)
    best: list[dict] = []
    best_lvl = ""
    for adm in LEVELS:
        gdf = _load_country(iso3, adm)
        if gdf is None or gdf.empty:
            continue
        units = _units_for(aoi, gdf)
        if len(units) >= 2:
            best, best_lvl = units, adm
            break
        if len(units) > len(best):
            best, best_lvl = units, adm
    if len(best) < 2:  # a single enclosing unit is not a sub-area aggregation; skip
        return 0
    out = {"level": best_lvl, "source": f"geoBoundaries gbOpen {iso3}", "license": "CC-BY-4.0", "units": best}
    (d / "admin.json").write_text(json.dumps(out), encoding="utf-8")
    return len(best)


def main() -> None:
    ok = 0
    for p in places_mod.list_places():
        n = gen_for_place(p)
        if n >= 0:
            print(f"{p.slug}: {n} admin units ({p.country})", flush=True)
            if n > 0:
                ok += 1
    print(f"\nwrote admin.json for {ok} places", flush=True)


if __name__ == "__main__":
    main()
