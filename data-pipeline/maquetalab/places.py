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
    # --- Gran Santiago comunas (each comuna as its own case; keeps santiago_full as the metro core) ---
    Place("stgo_cerrillos", "Cerrillos", "B", -70.7158, -33.5022, 3227, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Cerrillos"),
    Place("stgo_cerro_navia", "Cerro Navia", "B", -70.7455, -33.4253, 3088, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Cerro Navia"),
    Place("stgo_conchali", "Conchalí", "B", -70.6748, -33.3843, 2077, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Conchalí"),
    Place("stgo_el_bosque", "El Bosque", "B", -70.6767, -33.5617, 2564, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of El Bosque"),
    Place("stgo_estacion_central", "Estación Central", "B", -70.705, -33.4627, 2882, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Estación Central"),
    Place("stgo_huechuraba", "Huechuraba", "B", -70.6498, -33.3709, 4254, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Huechuraba"),
    Place("stgo_independencia", "Independencia", "B", -70.6659, -33.4157, 1831, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Independencia"),
    Place("stgo_la_cisterna", "La Cisterna", "B", -70.6643, -33.5298, 2110, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of La Cisterna"),
    Place("stgo_la_florida", "La Florida", "B", -70.5738, -33.5371, 4485, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of La Florida"),
    Place("stgo_la_granja", "La Granja", "B", -70.6223, -33.5364, 2598, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of La Granja"),
    Place("stgo_la_pintana", "La Pintana", "B", -70.6366, -33.5914, 4025, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of La Pintana"),
    Place("stgo_la_reina", "La Reina", "B", -70.539, -33.4472, 3893, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of La Reina"),
    Place("stgo_las_condes", "Las Condes", "B", -70.5323, -33.3989, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Las Condes"),
    Place("stgo_lo_barnechea", "Lo Barnechea", "B", -70.512, -33.3428, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Lo Barnechea"),
    Place("stgo_lo_espejo", "Lo Espejo", "B", -70.6902, -33.5214, 2059, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Lo Espejo"),
    Place("stgo_lo_prado", "Lo Prado", "B", -70.7234, -33.447, 1641, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Lo Prado"),
    Place("stgo_macul", "Macul", "B", -70.5994, -33.4898, 2272, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Macul"),
    Place("stgo_maipu", "Maipú", "B", -70.7603, -33.5175, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Maipú"),
    Place("stgo_padre_hurtado", "Padre Hurtado", "B", -70.8154, -33.5726, 2761, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Padre Hurtado"),
    Place("stgo_pedro_aguirre_cerda", "Pedro Aguirre Cerda", "B", -70.6769, -33.4932, 1940, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Pedro Aguirre Cerda"),
    Place("stgo_penalolen", "Peñalolén", "B", -70.5459, -33.485, 3981, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Peñalolén"),
    Place("stgo_pirque", "Pirque", "B", -70.5394, -33.6279, 2663, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Pirque"),
    Place("stgo_providencia", "Providencia", "B", -70.6111, -33.4296, 2509, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Providencia"),
    Place("stgo_pudahuel", "Pudahuel", "B", -70.7599, -33.4443, 3025, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Pudahuel"),
    Place("stgo_puente_alto", "Puente Alto", "B", -70.552, -33.5955, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Puente Alto"),
    Place("stgo_quilicura", "Quilicura", "B", -70.7249, -33.3548, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Quilicura"),
    Place("stgo_quinta_normal", "Quinta Normal", "B", -70.6999, -33.4283, 2376, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Quinta Normal"),
    Place("stgo_recoleta", "Recoleta", "B", -70.6326, -33.4059, 3309, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Recoleta"),
    Place("stgo_renca", "Renca", "B", -70.7312, -33.404, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Renca"),
    Place("stgo_san_bernardo", "San Bernardo", "B", -70.6899, -33.5905, 4500, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of San Bernardo"),
    Place("stgo_san_joaquin", "San Joaquín", "B", -70.6284, -33.4942, 2731, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of San Joaquín"),
    Place("stgo_san_jose_de_maipo", "San José de Maipo", "B", -70.4698, -33.5867, 2381, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of San José de Maipo"),
    Place("stgo_san_miguel", "San Miguel", "B", -70.6522, -33.4976, 2351, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of San Miguel"),
    Place("stgo_san_ramon", "San Ramón", "B", -70.6426, -33.5379, 2267, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of San Ramón"),
    Place("stgo_santiago", "Santiago", "B", -70.6544, -33.4522, 3100, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Santiago"),
    Place("stgo_vitacura", "Vitacura", "B", -70.5656, -33.3801, 4472, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Vitacura"),
    Place("stgo_nunoa", "Ñuñoa", "B", -70.6007, -33.4541, 2821, "South America", "Chile", "Santiago",
          "Chile; Santiago comuna of Ñuñoa"),

    Place("valparaiso", "Valparaiso", "B", -71.6120, -33.0470, 1300, "South America", "Chile", "Valparaiso",
          "Chile; hillside amphitheatre terrain + dense fabric"),
    Place("concepcion", "Concepcion", "B", -73.0500, -36.8270, 1300, "South America", "Chile", "Concepcion",
          "Chile"),
    Place("calama", "Calama", "B", -68.9294, -22.4547, 1900, "South America", "Chile", "Calama",
          "Atacama desert mining city; near Chuquicamata; 2.5D heights"),
    Place("antofagasta", "Antofagasta", "B", -70.3975, -23.6509, 2200, "South America", "Chile", "Antofagasta",
          "Pacific coast mining port; narrow strip between ocean and desert"),
    Place("sierra_gorda", "Sierra Gorda", "B", -69.3130, -22.8942, 1500, "South America", "Chile", "Sierra Gorda",
          "small Atacama mining town; sparse desert fabric"),
    Place("valdivia", "Valdivia", "B", -73.2452, -39.8196, 1900, "South America", "Chile", "Valdivia",
          "southern river city; confluence + wetlands"),
    Place("chiloe_castro", "Chiloe (Castro)", "B", -73.7620, -42.4823, 1700, "South America", "Chile", "Chiloe",
          "archipelago capital; palafitos + wooden churches"),
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
    Place("shanghai_bund", "Shanghai (The Bund)", "B", 121.4900, 31.2400, 1300, "Asia", "China", "Shanghai",
          "Huangpu waterfront; Pudong high-rise across the river"),
    Place("beijing_center", "Beijing Center", "B", 116.3910, 39.9075, 1300, "Asia", "China", "Beijing",
          "imperial core; low-rise hutong fabric"),
    Place("hong_kong_central", "Hong Kong Central", "B", 114.1580, 22.2800, 1200, "Asia", "China", "Hong Kong",
          "extreme vertical density on steep terrain"),
    Place("delhi_center", "Delhi (Connaught Place)", "B", 77.2167, 28.6315, 1300, "Asia", "India", "Delhi",
          "South Asia; 2.5D heights"),
    Place("bangkok_center", "Bangkok Center", "B", 100.5010, 13.7460, 1300, "Asia", "Thailand", "Bangkok",
          "Chao Phraya fabric; 2.5D heights"),
    Place("jakarta_center", "Jakarta Center", "B", 106.8230, -6.1750, 1300, "Asia", "Indonesia", "Jakarta",
          "megacity delta; 2.5D heights"),
    Place("dubai_downtown", "Dubai Downtown", "B", 55.2740, 25.1970, 1300, "Asia", "UAE", "Dubai",
          "desert supertall cluster"),
    Place("los_angeles_downtown", "Los Angeles Downtown", "B", -118.2500, 34.0490, 1300, "North America", "USA", "Los Angeles",
          "downtown towers in a low sprawl"),
    Place("chicago_loop", "Chicago Loop", "B", -87.6290, 41.8820, 1300, "North America", "USA", "Chicago",
          "the Loop; lakefront high-rise"),
    Place("lagos_island", "Lagos Island", "B", 3.3900, 6.4530, 1300, "Africa", "Nigeria", "Lagos",
          "Africa's largest metro; 2.5D heights"),

    # --- World metro cores: 4.5 km AOIs sized to span official sub-areas (boroughs / wards / arrondissements /
    #     districts / comunas) for the Aggregate-by-admin-area tool, while keeping each buildings.glb light.
    Place("nyc_full", "New York (metro core)", "B", -73.9600, 40.7150, 4500, "North America", "USA", "New York",
          "the five boroughs core (Manhattan/Brooklyn/Queens/Bronx); aggregate by borough"),
    Place("london_full", "London (metro core)", "B", -0.1100, 51.5070, 4500, "Europe", "UK", "London",
          "central London boroughs; aggregate by borough"),
    Place("paris_full", "Paris (metro core)", "B", 2.3480, 48.8560, 4500, "Europe", "France", "Paris",
          "arrondissements + petite couronne; aggregate by arrondissement/commune"),
    Place("berlin_full", "Berlin (metro core)", "B", 13.4040, 52.5200, 4500, "Europe", "Germany", "Berlin",
          "central Bezirke; aggregate by Bezirk"),
    Place("barcelona_full", "Barcelona (metro core)", "B", 2.1650, 41.3900, 4500, "Europe", "Spain", "Barcelona",
          "the city districtes; aggregate by districte"),
    Place("tokyo_full", "Tokyo (metro core)", "B", 139.7520, 35.6850, 4500, "Asia", "Japan", "Tokyo",
          "the central special wards; aggregate by ward (ku)"),
    Place("seoul_full", "Seoul (metro core)", "B", 126.9860, 37.5520, 4500, "Asia", "South Korea", "Seoul",
          "central gu districts; aggregate by gu"),
    Place("delhi_full", "Delhi (metro core)", "B", 77.2100, 28.6300, 4500, "Asia", "India", "Delhi",
          "central Delhi districts; aggregate by district"),
    Place("mexico_city_full", "Mexico City (metro core)", "B", -99.1400, 19.4120, 4500, "North America", "Mexico", "Mexico City",
          "the central alcaldias; aggregate by alcaldia"),
    Place("buenos_aires_full", "Buenos Aires (metro core)", "B", -58.4400, -34.6100, 4500, "South America", "Argentina", "Buenos Aires",
          "the CABA comunas; aggregate by comuna"),
    Place("sao_paulo_full", "Sao Paulo (metro core)", "B", -46.6400, -23.5500, 4500, "South America", "Brazil", "Sao Paulo",
          "central distritos/subprefeituras; aggregate by distrito"),

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

    # --- Iconic landmarks + landscapes across the world (monuments the terrain + footprints render) ---
    Place("giza_pyramids", "Giza Pyramids", "C", 31.1313, 29.9773, 1400, "Africa", "Egypt", "Giza",
          "the three great pyramids + Sphinx; GLO-30 renders the monuments as relief"),
    Place("machu_picchu", "Machu Picchu", "C", -72.5450, -13.1631, 1600, "South America", "Peru", "Machu Picchu",
          "Inca citadel on a knife-edge ridge; dramatic Andes relief"),
    Place("agra_taj", "Agra (Taj Mahal)", "B", 78.0421, 27.1751, 1400, "Asia", "India", "Agra",
          "Taj Mahal + Yamuna riverfront; 2.5D heights"),
    Place("great_wall", "Great Wall (Badaling)", "C", 116.0166, 40.3597, 2600, "Asia", "China", "Great Wall",
          "the wall snaking over ridgelines"),
    Place("petra", "Petra", "C", 35.4444, 30.3285, 1800, "Asia", "Jordan", "Petra",
          "rock-cut city in a sandstone canyon"),
    Place("angkor_wat", "Angkor Wat", "C", 103.8670, 13.4125, 1900, "Asia", "Cambodia", "Angkor",
          "temple complex + moat in the forest"),
    Place("mount_fuji", "Mount Fuji", "C", 138.7274, 35.3606, 4500, "Asia", "Japan", "Mount Fuji",
          "isolated stratovolcano cone"),
    Place("rio_de_janeiro", "Rio de Janeiro", "B", -43.1729, -22.9068, 3200, "South America", "Brazil", "Rio de Janeiro",
          "city between granite peaks and the bay; Corcovado + Sugarloaf relief"),
    Place("venice", "Venice", "B", 12.3358, 45.4340, 1500, "Europe", "Italy", "Venice",
          "island city laced with canals"),
    Place("matterhorn", "Matterhorn (Zermatt)", "C", 7.6586, 45.9763, 3500, "Europe", "Switzerland", "Matterhorn",
          "iconic alpine horn; extreme relief"),
    Place("yosemite_valley", "Yosemite Valley", "C", -119.5575, 37.7420, 3500, "North America", "USA", "Yosemite",
          "granite walls + valley floor"),
    Place("victoria_falls", "Victoria Falls", "C", 25.8572, -17.9243, 2500, "Africa", "Zimbabwe", "Victoria Falls",
          "gorge + waterfall on the Zambezi"),
    Place("santorini", "Santorini (Thera)", "B", 25.4318, 36.4139, 2200, "Europe", "Greece", "Santorini",
          "caldera-rim towns on volcanic cliffs"),
    Place("monument_valley", "Monument Valley", "C", -110.1097, 36.9833, 3500, "North America", "USA", "Monument Valley",
          "sandstone buttes on a desert plain"),
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
