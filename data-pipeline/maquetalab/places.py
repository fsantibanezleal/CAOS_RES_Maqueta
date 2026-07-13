"""The place registry: the curated AOIs Maqueta reconstructs, grouped by tier.

A Place is Maqueta's unit of work (the archetype's "case"), carrying a stable slug, a WGS84
centre + half-size, a tier (the archetype "category"), and notes. Tiers:

  * A - ground-truth: places with open LoD2/lidar to benchmark the fusion against.
  * B - global-fusion cities: Overture + GLO-30 + WorldCover everywhere; heights via the ladder.
  * C - terrain-first areas: little/no built-up; terrain + land cover + water carry the scene.

Every place ships only if its layers pass the QA gate at bake time; the list is the target set.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Place:
    slug: str
    name: str
    tier: str  # "A" | "B" | "C"
    lon: float
    lat: float
    half_size_m: float
    country: str
    note: str = ""

    @property
    def category(self) -> str:
        return {"A": "ground-truth", "B": "global-fusion city", "C": "terrain-first area"}[self.tier]


PLACES: list[Place] = [
    # --- Tier A: ground-truth (open LoD2 / lidar available) ---
    Place("berlin_mitte", "Berlin Mitte", "A", 13.4050, 52.5170, 1200, "Germany",
          "the inspiration's replica area; LoD2 CityGML available"),
    Place("amsterdam_center", "Amsterdam Centrum", "A", 4.8952, 52.3702, 1200, "Netherlands",
          "3DBAG LoD2.2 ground truth"),
    Place("delft", "Delft", "A", 4.3571, 52.0116, 1100, "Netherlands", "3DBAG home city; dense LoD2"),
    Place("manhattan_midtown", "Manhattan Midtown", "A", -73.9840, 40.7549, 1300, "USA",
          "the Janosov Manhattan area; USGS 3DEP lidar"),
    Place("helsinki_center", "Helsinki Centre", "A", 24.9410, 60.1699, 1200, "Finland",
          "open LoD2 city model"),
    Place("zurich_center", "Zurich Altstadt", "A", 8.5417, 47.3769, 1000, "Switzerland",
          "swisstopo open 3D"),
    Place("vienna_center", "Vienna Innere Stadt", "A", 16.3738, 48.2082, 1200, "Austria",
          "open LoD2"),
    Place("singapore_downtown", "Singapore Downtown", "A", 103.8520, 1.2830, 1300, "Singapore",
          "OpenStreetMap-rich high-rise core"),
    Place("tokyo_shinjuku", "Tokyo Shinjuku", "A", 139.7000, 35.6900, 1300, "Japan",
          "PLATEAU LoD2 open city model"),
    Place("seattle_downtown", "Seattle Downtown", "A", -122.3320, 47.6060, 1200, "USA",
          "USGS 3DEP lidar; dense downtown"),

    # --- Tier B: global-fusion cities (heights via the provenance ladder) ---
    Place("santiago_centro", "Santiago Centro", "B", -70.6500, -33.4370, 1400, "Chile",
          "Chile; Open Buildings 2.5D raster heights carry sparse OSM"),
    Place("valparaiso", "Valparaiso", "B", -71.6120, -33.0470, 1300, "Chile",
          "Chile; hillside amphitheatre terrain + dense fabric"),
    Place("concepcion", "Concepcion", "B", -73.0500, -36.8270, 1300, "Chile", "Chile"),
    Place("london_city", "London City", "B", -0.0900, 51.5150, 1300, "UK", "OSM-rich"),
    Place("barcelona_eixample", "Barcelona Eixample", "B", 2.1620, 41.3900, 1200, "Spain",
          "Cerda grid; Spanish IGN in Overture"),
    Place("paris_center", "Paris Centre", "B", 2.3480, 48.8560, 1200, "France", "Haussmann fabric"),
    Place("buenos_aires_center", "Buenos Aires Centro", "B", -58.3810, -34.6040, 1300, "Argentina",
          "Latin America; 2.5D heights"),
    Place("mexico_city_center", "Mexico City Centro", "B", -99.1330, 19.4330, 1300, "Mexico",
          "Latin America; 2.5D heights"),
    Place("sao_paulo_center", "Sao Paulo Centro", "B", -46.6340, -23.5500, 1300, "Brazil",
          "Latin America; dense high-rise"),
    Place("nairobi_center", "Nairobi CBD", "B", 36.8170, -1.2830, 1300, "Kenya",
          "Africa; 2.5D heights carry sparse OSM"),
    Place("mumbai_fort", "Mumbai Fort", "B", 72.8330, 18.9330, 1200, "India",
          "South Asia; 2.5D heights"),
    Place("seoul_jongno", "Seoul Jongno", "B", 126.9840, 37.5720, 1200, "South Korea", "OSM-rich"),
    Place("sydney_cbd", "Sydney CBD", "B", 151.2070, -33.8680, 1200, "Australia", "OSM-rich"),
    Place("san_francisco_downtown", "San Francisco Downtown", "B", -122.4010, 37.7910, 1200, "USA",
          "steep terrain + towers"),
    Place("toronto_downtown", "Toronto Downtown", "B", -79.3810, 43.6480, 1200, "Canada", "OSM-rich"),
    Place("istanbul_center", "Istanbul Fatih", "B", 28.9640, 41.0110, 1300, "Turkey",
          "peninsula fabric"),
    Place("cairo_center", "Cairo Downtown", "B", 31.2440, 30.0480, 1300, "Egypt",
          "Africa; 2.5D heights"),
    Place("moscow_center", "Moscow Center", "B", 37.6180, 55.7510, 1300, "Russia", "OSM-rich"),
    Place("rome_center", "Rome Centro Storico", "B", 12.4830, 41.8950, 1200, "Italy",
          "historic low-rise fabric"),
    Place("lisbon_baixa", "Lisbon Baixa", "B", -9.1390, 38.7100, 1100, "Portugal",
          "riverfront + hills"),
    Place("cape_town_center", "Cape Town CBD", "B", 18.4240, -33.9210, 1300, "South Africa",
          "Africa; Table Mountain backdrop terrain"),
    Place("bogota_center", "Bogota Centro", "B", -74.0720, 4.5980, 1300, "Colombia",
          "Latin America; 2.5D heights"),

    # --- Tier C: terrain-first areas (little/no built-up) ---
    Place("chuquicamata", "Chuquicamata Mine", "C", -68.9020, -22.3020, 2500, "Chile",
          "Chile; open-pit copper mine, terrain-dominated"),
    Place("valle_luna", "Valle de la Luna (Atacama)", "C", -68.2870, -22.9250, 3000, "Chile",
          "Chile; Atacama desert relief"),
    Place("torres_paine", "Torres del Paine", "C", -72.9880, -50.9420, 3500, "Chile",
          "Chile; alpine massif terrain"),
    Place("grand_canyon", "Grand Canyon (South Rim)", "C", -112.1130, 36.0640, 3500, "USA",
          "canyon relief; 3DEP lidar"),
    Place("mont_blanc", "Mont Blanc", "C", 6.8650, 45.8330, 3500, "France", "alpine high relief"),
    Place("iguazu", "Iguazu Falls", "C", -54.4370, -25.6950, 2500, "Argentina",
          "falls + forest land cover"),
    Place("uluru", "Uluru", "C", 131.0360, -25.3440, 2500, "Australia", "isolated inselberg"),
    Place("halong_bay", "Ha Long Bay", "C", 107.0430, 20.9100, 3000, "Vietnam",
          "karst towers + water"),
]

_BY_SLUG = {p.slug: p for p in PLACES}


def list_places() -> list[Place]:
    return list(PLACES)


def get_place(slug: str) -> Place:
    if slug not in _BY_SLUG:
        raise KeyError(f"unknown place {slug!r}; known: {sorted(_BY_SLUG)}")
    return _BY_SLUG[slug]


def by_tier() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for p in PLACES:
        out.setdefault(p.tier, []).append(p.slug)
    return out
