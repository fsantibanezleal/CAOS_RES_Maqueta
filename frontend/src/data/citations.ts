// Citation library (ADR-0016 §7). Every entry has a real DOI or URL; inline <Cite id="..."/> and
// per-section <Refs/> resolve against these ids. Transcribed from the persisted research dossiers
// (CAOS_MANAGE/wip/maqueta/research-*-2026-07-12.md). No invented references, no bibliography dump.
import type { Citation } from '@fasl-work/caos-app-shell';

export const CITATIONS: Citation[] = [
  { id: 'overture', label: 'Overture Maps Foundation 2026', citation: 'Overture Maps Foundation (2026). Buildings and Transportation themes: conflated open map data (GeoParquet).', url: 'https://docs.overturemaps.org/guides/buildings/' },
  { id: 'glo30', label: 'ESA/DLR/Airbus 2024 (Copernicus GLO-30)', citation: 'ESA, DLR, Airbus (2024). Copernicus GLO-30 Global Digital Surface Model, on the AWS Registry of Open Data.', url: 'https://registry.opendata.aws/copernicus-dem/' },
  { id: 'demcompare', label: 'Marsh et al. 2024', citation: 'Marsh, C. B., et al. (2024). Vertical accuracy assessment of freely available global DEMs (FABDEM, Copernicus, NASADEM, AW3D30, SRTM). International Journal of Digital Earth, 17(1).', doi: '10.1080/17538947.2024.2308734' },
  { id: 'worldcover', label: 'Zanaga et al. 2022 (ESA WorldCover)', citation: 'Zanaga, D., et al. (2022). ESA WorldCover 10 m 2021 v200 land-cover product.', url: 'https://esa-worldcover.org/en/data-access' },
  { id: 'openbuildings25d', label: 'Sirko et al. 2024 (Open Buildings 2.5D)', citation: 'Sirko, W., et al. (2024). Open Buildings 2.5D Temporal Dataset: building presence, count and height across the Global South, from Sentinel-2. Google Research.', url: 'https://sites.research.google/gr/open-buildings/temporal/' },
  { id: 'ghsl', label: 'Pesaresi & Politis 2023 (GHS-POP)', citation: 'Pesaresi, M., & Politis, P. (2023). GHS-POP R2023A: global population grid multitemporal (1975-2030). European Commission, JRC.', url: 'https://human-settlement.emergency.copernicus.eu/ghs_pop.php' },
  { id: '3dbag', label: 'Peters et al. 2022 (3D BAG)', citation: 'Peters, R., Dukai, B., Vitalis, S., van Liempt, J., & Stoter, J. (2022). Automated 3D reconstruction of LoD2 building models for the Netherlands (3D BAG). Photogrammetric Engineering & Remote Sensing, 88(3), 165-170.', doi: '10.14358/PERS.21-00032R2' },
  { id: 'delatin', label: 'Duchaineau et al. 1997 / Agafonkin 2019', citation: 'Duchaineau, M., et al. (1997). ROAMing Terrain: Real-time Optimally Adapting Meshes. IEEE Visualization; greedy-refinement TIN (Delatin) implementation by Agafonkin (2019).', url: 'https://github.com/kylebarron/pydelatin' },
  { id: 'usgs3dep', label: 'USGS 2024 (3DEP lidar)', citation: 'U.S. Geological Survey (2024). 3D Elevation Program lidar point clouds (Entwine Point Tiles, public domain) on the AWS Registry of Open Data.', url: 'https://registry.opendata.aws/usgs-lidar/' },
  { id: 'gltf', label: 'Khronos 2021 (glTF 2.0 + Draco)', citation: 'Khronos Group (2021). glTF 2.0 with Draco / meshopt mesh compression for streaming 3D content.', url: 'https://cesium.com/blog/2018/04/09/draco-compression/' },
  { id: 'janosov', label: 'Janosov 2026 (46,000 buildings)', citation: 'Janosov, M. (2026). One Prompt, 46,000 Buildings: a fully interactive 3D city (Three.js/WebGL over OpenStreetMap extrusion).', url: 'https://milanjanosov.substack.com/p/one-prompt-46000-buildings-my-first' },
];
