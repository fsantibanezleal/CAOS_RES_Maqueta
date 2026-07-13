"""The place registry: the curated AOIs Maqueta reconstructs.

A Place is Maqueta's unit of work, carrying a stable slug, a WGS84 centre + half-size, a
geographic hierarchy (continent > country > city), a tier, and notes. Tiers:

  * A - ground-truth: places with open LoD2/lidar to benchmark the fusion against.
  * B - global-fusion cities: Overture + GLO-30 + WorldCover everywhere; heights via the ladder
        (with the Open Buildings 2.5D height raster carrying the Global South).
  * C - terrain-first areas: little/no built-up; terrain + land cover + water carry the scene.

The App groups places by the geographic hierarchy (continent > country > city); Experiments and
Benchmark summarise across tiers.
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
    continent: str
    country: str
    city: str
    note: str = ""

    @property
    def category(self) -> str:
        return {"A": "ground-truth", "B": "global-fusion city", "C": "terrain-first area"}[self.tier]


PLACES: list[Place] = [
    # --- Tier A: ground-truth (open LoD2 / lidar available) ---
    Place("berlin_mitte", "Berlin Mitte", "A", 13.4050, 52.5170, 1200, "Europe", "Germany", "Berlin",
          "the inspiration's replica area; LoD2 CityGML available"),
    Place("amsterdam_center", "Amsterdam Centrum", "A", 4.8952, 52.3702, 1200, "Europe", "Netherlands", "Amsterdam",
          "3DBAG LoD2.2 ground truth"),
    Place("delft", "Delft", "A", 4.3571, 52.0116, 1100, "Europe", "Netherlands", "Delft",
          "3DBAG home city; dense LoD2"),
    Place("manhattan_midtown", "Manhattan Midtown", "A", -73.9840, 40.7549, 1300, "North America", "USA", "New York",
          "the Janosov Manhattan area; USGS 3DEP lidar"),
    Place("helsinki_center", "Helsinki Centre", "A", 24.9410, 60.1699, 1200, "Europe", "Finland", "Helsinki",
          "open LoD2 city model"),
    Place("zurich_center", "Zurich Altstadt", "A", 8.5417, 47.3769, 1000, "Europe", "Switzerland", "Zurich",
          "swisstopo open 3D"),
    Place("vienna_center", "Vienna Innere Stadt", "A", 16.3738, 48.2082, 1200, "Europe", "Austria", "Vienna",
          "open LoD2"),
    Place("singapore_downtown", "Singapore Downtown", "A", 103.8520, 1.2830, 1300, "Asia", "Singapore", "Singapore",
          "OpenStreetMap-rich high-rise core"),
    Place("tokyo_shinjuku", "Tokyo Shinjuku", "A", 139.7000, 35.6900, 1300, "Asia", "Japan", "Tokyo",
          "PLATEAU LoD2 open city model"),
    Place("seattle_downtown", "Seattle Downtown", "A", -122.3320, 47.6060, 1200, "North America", "USA", "Seattle",
          "USGS 3DEP lidar; dense downtown"),

    # --- Tier B: global-fusion cities (heights via the provenance ladder) ---
    Place("santiago_centro", "Santiago Centro", "B", -70.6500, -33.4370, 1400, "South America", "Chile", "Santiago",
          "Chile; Open Buildings 2.5D raster heights carry sparse OSM"),
    Place("santiago_full", "Santiago (metro core)", "B", -70.6480, -33.4560, 5500, "South America", "Chile", "Santiago",
          "Chile; the full metro core (11 km) across Santiago/Providencia/Nunoa/Las Condes; 2.5D raster heights"),
    Place("valparaiso", "Valparaiso", "B", -71.6120, -33.0470, 1300, "South America", "Chile", "Valparaiso",
          "Chile; hillside amphitheatre terrain + dense fabric"),
    Place("concepcion", "Concepcion", "B", -73.0500, -36.8270, 1300, "South America", "Chile", "Concepcion",
          "Chile"),
    Place("london_city", "London City", "B", -0.0900, 51.5150, 1300, "Europe", "UK", "London", "OSM-rich"),
    Place("barcelona_eixample", "Barcelona Eixample", "B", 2.1620, 41.3900, 1200, "Europe", "Spain", "Barcelona",
          "Cerda grid; Spanish IGN in Overture"),
    Place("paris_center", "Paris Centre", "B", 2.3480, 48.8560, 1200, "Europe", "France", "Paris",
          "Haussmann fabric"),
    Place("buenos_aires_center", "Buenos Aires Centro", "B", -58.3810, -34.6040, 1300, "South America", "Argentina", "Buenos Aires",
          "Latin America; 2.5D heights"),
    Place("mexico_city_center", "Mexico City Centro", "B", -99.1330, 19.4330, 1300, "North America", "Mexico", "Mexico City",
          "Latin America; 2.5D heights"),
    Place("sao_paulo_center", "Sao Paulo Centro", "B", -46.6340, -23.5500, 1300, "South America", "Brazil", "Sao Paulo",
          "Latin America; dense high-rise"),
    Place("nairobi_center", "Nairobi CBD", "B", 36.8170, -1.2830, 1300, "Africa", "Kenya", "Nairobi",
          "Africa; 2.5D heights carry sparse OSM"),
    Place("mumbai_fort", "Mumbai Fort", "B", 72.8330, 18.9330, 1200, "Asia", "India", "Mumbai",
          "South Asia; 2.5D heights"),
    Place("seoul_jongno", "Seoul Jongno", "B", 126.9840, 37.5720, 1200, "Asia", "South Korea", "Seoul", "OSM-rich"),
    Place("sydney_cbd", "Sydney CBD", "B", 151.2070, -33.8680, 1200, "Oceania", "Australia", "Sydney", "OSM-rich"),
    Place("san_francisco_downtown", "San Francisco Downtown", "B", -122.4010, 37.7910, 1200, "North America", "USA", "San Francisco",
          "steep terrain + towers"),
    Place("toronto_downtown", "Toronto Downtown", "B", -79.3810, 43.6480, 1200, "North America", "Canada", "Toronto", "OSM-rich"),
    Place("istanbul_center", "Istanbul Fatih", "B", 28.9640, 41.0110, 1300, "Europe", "Turkey", "Istanbul",
          "peninsula fabric"),
    Place("cairo_center", "Cairo Downtown", "B", 31.2440, 30.0480, 1300, "Africa", "Egypt", "Cairo",
          "Africa; 2.5D heights"),
    Place("moscow_center", "Moscow Center", "B", 37.6180, 55.7510, 1300, "Europe", "Russia", "Moscow", "OSM-rich"),
    Place("rome_center", "Rome Centro Storico", "B", 12.4830, 41.8950, 1200, "Europe", "Italy", "Rome",
          "historic low-rise fabric"),
    Place("lisbon_baixa", "Lisbon Baixa", "B", -9.1390, 38.7100, 1100, "Europe", "Portugal", "Lisbon",
          "riverfront + hills"),
    Place("cape_town_center", "Cape Town CBD", "B", 18.4240, -33.9210, 1300, "Africa", "South Africa", "Cape Town",
          "Africa; Table Mountain backdrop terrain"),
    Place("bogota_center", "Bogota Centro", "B", -74.0720, 4.5980, 1300, "South America", "Colombia", "Bogota",
          "Latin America; 2.5D heights"),

    # --- Tier C: terrain-first areas (little/no built-up) ---
    Place("chuquicamata", "Chuquicamata Mine", "C", -68.9020, -22.3020, 2500, "South America", "Chile", "Chuquicamata",
          "Chile; open-pit copper mine, terrain-dominated"),
    Place("valle_luna", "Valle de la Luna (Atacama)", "C", -68.2870, -22.9250, 3000, "South America", "Chile", "Atacama",
          "Chile; Atacama desert relief"),
    Place("torres_paine", "Torres del Paine", "C", -72.9880, -50.9420, 3500, "South America", "Chile", "Torres del Paine",
          "Chile; alpine massif terrain"),
    Place("grand_canyon", "Grand Canyon (South Rim)", "C", -112.1130, 36.0640, 3500, "North America", "USA", "Grand Canyon",
          "canyon relief; 3DEP lidar"),
    Place("mont_blanc", "Mont Blanc", "C", 6.8650, 45.8330, 3500, "Europe", "France", "Mont Blanc", "alpine high relief"),
    Place("iguazu", "Iguazu Falls", "C", -54.4370, -25.6950, 2500, "South America", "Argentina", "Iguazu",
          "falls + forest land cover"),
    Place("uluru", "Uluru", "C", 131.0360, -25.3440, 2500, "Oceania", "Australia", "Uluru", "isolated inselberg"),
    Place("halong_bay", "Ha Long Bay", "C", 107.0430, 20.9100, 3000, "Asia", "Vietnam", "Ha Long",
          "karst towers + water"),
]

_BY_SLUG = {p.slug: p for p in PLACES}
# Continent display order (roughly by how the app reads left-to-right).
CONTINENT_ORDER = ["South America", "North America", "Europe", "Africa", "Asia", "Oceania"]


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


def hierarchy() -> list[dict]:
    """Places nested continent > country > city, in a stable display order."""
    tree: dict[str, dict[str, dict[str, list[str]]]] = {}
    for p in PLACES:
        tree.setdefault(p.continent, {}).setdefault(p.country, {}).setdefault(p.city, []).append(p.slug)
    out = []
    for cont in sorted(tree, key=lambda c: (CONTINENT_ORDER.index(c) if c in CONTINENT_ORDER else 99, c)):
        countries = []
        for country in sorted(tree[cont]):
            cities = [
                {"city": city, "slugs": tree[cont][country][city]} for city in sorted(tree[cont][country])
            ]
            countries.append({"country": country, "cities": cities})
        out.append({"continent": cont, "countries": countries})
    return out
