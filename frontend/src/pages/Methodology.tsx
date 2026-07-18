// Methodology (ADR-0016 §6, §7, §9C): one vertical sub-tab per method family, each with bilingual prose,
// KaTeX governing equations, a theme-aware inline SVG figure, an assumptions/limitations Callout, and a
// per-section <Refs>. Transcribed from CAOS_GeoScena/docs + the persisted research dossiers. No card grid.
import { Callout, Cite, Equation, Figure, Refs, SubTabs, useShellLang } from '@fasl-work/caos-app-shell';
import type { ReactNode } from 'react';

// A small theme-aware figure frame: the SVG inherits colours from CSS palette variables (light/dark) and
// carries bilingual labels, per ADR-0016 §7.4.
function Fig({ viewBox, caption, children }: { viewBox: string; caption: ReactNode; children: ReactNode }) {
  return (
    <Figure caption={caption}>
      <svg className="mq-fig-svg" viewBox={viewBox} role="img" preserveAspectRatio="xMidYMid meet">
        {children}
      </svg>
    </Figure>
  );
}

export default function Methodology() {
  const es = useShellLang() === 'es';
  const t = (en: string, esx: string) => (es ? esx : en);

  const FUSION = (
    <div className="mq-method">
      <p>
        {t(
          'Maqueta performs multi-modal, feature-level data fusion: it combines neither raw pixels nor final decisions, but aligns heterogeneous modalities (vector footprints, raster DSM, categorical land cover, population density, 2.5D heights, LoD2 models, satellite multispectral indices, solar and climate normals, per-comuna socio-economic indicators) into a single local metric frame and then combines them per building or per cell. The height map is the entry point and the geometric scaffold; every other modality registers onto it.',
          'Maqueta hace fusion de datos multi-modal a nivel de caracteristicas (feature-level): no combina pixeles crudos ni decisiones finales, sino que alinea modalidades heterogeneas (huellas vectoriales, DSM raster, cobertura categorica, densidad de poblacion, alturas 2.5D, modelos LoD2, indices multiespectrales satelitales, normales de solar y clima, indicadores socioeconomicos por comuna) en un unico marco metrico local y luego las combina por edificio o por celda. El mapa de alturas es el punto de entrada y el andamio geometrico; cada otra modalidad se registra sobre el.',
        )}{' '}
        <Cite id="fusionlevels" />
      </p>
      <p>
        {t(
          'An Area of Interest is a WGS84 centre plus a half-size in metres. Every layer is expressed in a local Azimuthal Equidistant projection centred on the AOI centroid, in metres, origin (0,0) at the centre. Over few-kilometre extents the distortion is well under a metre, so the viewer works directly in metres. On glTF export a single Y-up conversion is applied, so every .glb shares one orientation and a Three.js scene loads the layers with no per-app fix-up.',
          'Un Area de Interes es un centro WGS84 mas un semilado en metros. Cada capa se expresa en una proyeccion Acimutal Equidistante local centrada en el centroide del AOI, en metros, origen (0,0) en el centro. En extensiones de pocos kilometros la distorsion es muy inferior a un metro, y el visor trabaja directo en metros. En exportacion glTF se aplica una sola conversion a Y-arriba, así cada .glb comparte una orientacion y una escena Three.js carga las capas sin correccion por app.',
        )}
      </p>
      <Equation
        tex={String.raw`(x_{\text{glTF}},\,y_{\text{glTF}},\,z_{\text{glTF}}) = (\text{east},\ \text{up},\ -\text{north})`}
        caption={t('The single Y-up convention shared by every baked layer.', 'La unica convencion Y-arriba que comparte cada capa precalculada.')}
      />
      <Fig
        viewBox="0 0 520 210"
        caption={t('Heterogeneous modalities registered into one local metric frame, then combined per building/cell.',
          'Modalidades heterogeneas registradas en un unico marco metrico local, luego combinadas por edificio/celda.')}
      >
        {[
          { y: 24, en: 'Footprints (Overture)', es: 'Huellas (Overture)' },
          { y: 52, en: 'Terrain DSM (GLO-30)', es: 'Relieve DSM (GLO-30)' },
          { y: 80, en: 'Land cover / population', es: 'Cobertura / poblacion' },
          { y: 108, en: 'Satellite indices, solar, climate', es: 'Indices satelitales, solar, clima' },
        ].map((r, i) => (
          <g key={i}>
            <rect className={i === 3 ? 'f-bx-a' : 'f-bx'} x="16" y={r.y} width="230" height="22" rx="5" />
            <text className="f-tx" x="26" y={r.y + 15}>{t(r.en, r.es)}</text>
            <path className="f-ln-a" d={`M246 ${r.y + 11} L322 105`} markerEnd="url(#ar)" />
          </g>
        ))}
        <defs>
          <marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" />
          </marker>
        </defs>
        <rect className="f-bx-a" x="322" y="78" width="182" height="54" rx="7" />
        <text className="f-tx-b" x="336" y="100">{t('Local metric frame', 'Marco metrico local')}</text>
        <text className="f-mu" x="336" y="118">{t('east / up / -north, metres', 'este / arriba / -norte, metros')}</text>
      </Fig>
      <Callout variant="honest" title={t('Assumptions', 'Supuestos')}>
        {t('AEQD distortion is negligible only for few-km AOIs; a metro-scale AOI (11 km) still stays sub-metre. Fusion is feature-level: sources keep their identity and provenance, they are not blended into pixels.',
          'La distorsion AEQD es despreciable solo para AOIs de pocos km; un AOI a escala metropolitana (11 km) sigue bajo el metro. La fusion es a nivel de caracteristicas: las fuentes conservan su identidad y procedencia, no se mezclan en pixeles.')}
      </Callout>
      <Refs ids={['fusionlevels', 'glo30', 'gltf']} label={t('References', 'Referencias')} />
    </div>
  );

  const HEIGHTS = (
    <div className="mq-method">
      <p>
        {t(
          'Building height is the scaffold, so it is resolved by an explicit provenance ladder: for each footprint the first rule that yields a positive value wins, and the source used is recorded as a per-building tag so measured and inferred heights are never conflated.',
          'La altura del edificio es el andamio, así que se resuelve con una escalera de procedencia explicita: para cada huella gana la primera regla que da un valor positivo, y la fuente usada se registra como etiqueta por edificio, de modo que lo medido y lo inferido nunca se confunden.',
        )}
      </p>
      <Equation
        tex={String.raw`h_i = \begin{cases} h^{\text{meas}}_i & \text{if } h^{\text{meas}}_i > 0 \quad (\textsf{measured}) \\ n^{\text{floors}}_i \cdot \bar h_{\text{floor}} & \text{else if } n^{\text{floors}}_i > 0 \quad (\textsf{floors}) \\ h^{\text{raster}}_i & \text{else if raster covers } i \quad (\textsf{raster}) \\ h_{\text{prior}} & \text{otherwise} \quad (\textsf{prior}) \end{cases}`}
        caption={t('Measured (Overture/OSM); floors x floor-height (default 3.2 m); the Open Buildings 2.5D raster (Global South); a default prior. Clipped to a 2.5 m minimum.',
          'Medida (Overture/OSM); pisos x altura-de-piso (3.2 m por defecto); el raster 2.5D de Open Buildings (Sur Global); un prior por defecto. Con recorte al mínimo de 2.5 m.')}
      />
      <Fig
        viewBox="0 0 520 150"
        caption={t('The ladder: the first rung that fires sets the height and stamps the source tag.',
          'La escalera: el primer peldano que dispara fija la altura y estampa la etiqueta de fuente.')}
      >
        {[
          { x: 8, en: 'measured', es: 'medida', s: 'Overture / OSM' },
          { x: 136, en: 'floors', es: 'pisos', s: 'n x 3.2 m' },
          { x: 264, en: 'raster', es: 'raster', s: 'Open Buildings 2.5D' },
          { x: 392, en: 'prior', es: 'prior', s: 'default' },
        ].map((r, i) => (
          <g key={i}>
            <rect className="f-bx-a" x={r.x} y="30" width="112" height="46" rx="6" />
            <text className="f-tx-b" x={r.x + 12} y="52">{t(r.en, r.es)}</text>
            <text className="f-mu" x={r.x + 12} y="68">{r.s}</text>
            {i < 3 && <path className="f-ln" d={`M${r.x + 112} 53 L${r.x + 128} 53`} markerEnd="url(#ar2)" />}
          </g>
        ))}
        <defs>
          <marker id="ar2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker>
        </defs>
        <text className="f-mu" x="8" y="106">{t('the per-place source mix is baked and reported on the Benchmark', 'la mezcla de fuentes por lugar se hornea y se reporta en el Benchmark')}</text>
      </Fig>
      <Callout variant="honest" title={t('Assumptions', 'Supuestos')}>
        {t('An OSM-rich city is mostly "measured"; many Global-South cities lean on the 2.5D raster. The two are not presented as equally certain; the mix is auditable per place.',
          'Una ciudad rica en OSM es mayormente "medida"; muchas ciudades del Sur Global dependen del raster 2.5D. Las dos no se presentan como igualmente ciertas; la mezcla es auditable por lugar.')}
      </Callout>
      <Refs ids={['overture', 'openbuildings25d']} label={t('References', 'Referencias')} />
    </div>
  );

  const TERRAIN = (
    <div className="mq-method">
      <p>
        {t(
          'The DEM grid becomes an adaptive triangulated irregular network (TIN): dense where the relief is complex, sparse where it is flat. Starting from the corners, the greedy refinement inserts by rounds the highest vertical-error points and re-triangulates until the worst error falls below a threshold.',
          'La grilla del DEM se convierte en una red irregular de triangulos (TIN) adaptativa: densa donde el relieve es complejo, dispersa donde es plano. Partiendo de las esquinas, el refinamiento voraz inserta por rondas los puntos de mayor error vertical y re-triangula hasta que el peor error cae bajo un umbral.',
        )}
      </p>
      <Equation
        tex={String.raw`\max_{p \in \text{grid}} \left| z(p) - \hat z_{\mathcal{T}}(p) \right| \le \varepsilon`}
        caption={t('z is the true elevation; z-hat is the current TIN linear interpolation. Batched top-K insertion turns thousands of triangulations into dozens.',
          'z es la elevacion real; z-gorro es la interpolación lineal de la TIN actual. La insercion por lotes (top-K) pasa de miles de triangulaciones a decenas.')}
      />
      <Fig viewBox="0 0 520 150" caption={t('A uniform grid (left) refined to an adaptive TIN (right): triangles cluster on the slope.',
        'Una grilla uniforme (izq.) refinada a una TIN adaptativa (der.): los triangulos se agrupan en la pendiente.')}>
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => (
            <rect key={`g${r}${c}`} className="f-grid" x={20 + c * 34} y={20 + r * 28} width="34" height="28" />
          )))}
          <text className="f-mu" x="20" y="150">{t('uniform grid', 'grilla uniforme')}</text>
        </g>
        <path className="f-ln-a" d="M270 130 L290 40" markerEnd="url(#ar3)" />
        <defs><marker id="ar3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
        <g transform="translate(320,0)">
          <path className="f-ln" d="M20 118 L60 118 L120 118 L180 118 L180 20 L120 20 L60 20 L20 20 Z" />
          <path className="f-ln" d="M20 118 L180 20 M60 118 L60 20 M120 118 L120 20 M60 70 L120 70 M120 50 L180 50 M60 90 L120 60" />
          <text className="f-mu" x="20" y="150">{t('adaptive TIN', 'TIN adaptativa')}</text>
        </g>
      </Fig>
      <Callout variant="honest" title={t('Assumptions / limitations', 'Supuestos / limitaciones')}>
        {t('GLO-30 is a Digital Surface Model (30 m): it includes canopy and rooftops, so in dense cores the ground reads slightly high. It is a global product, not a national LiDAR DTM.',
          'GLO-30 es un Modelo Digital de Superficie (30 m): incluye dosel y techos, así que en centros densos el suelo queda algo alto. Es un producto global, no un DTM LiDAR nacional.')}
      </Callout>
      <Refs ids={['delatin', 'glo30', 'demcompare']} label={t('References', 'Referencias')} />
    </div>
  );

  const BUILDINGS = (
    <div className="mq-method">
      <p>
        {t(
          'Each footprint is projected to metres, its roof triangulated (ear-cutting, handling concave polygons) and extruded from a terrain-sampled base up to base+height, forming a closed prism (roof + walls). A per-vertex id links every triangle back to its building record, and per-building attributes (height, height source, land cover, footprint area, floor count, function, roof shape, plus the sampled analytical layers) ride in the glTF, so the viewer recolours, filters and selects by any attribute without recomputing. Roads are buffered by a class half-width and draped on the terrain.',
          'Cada huella se proyecta a metros, se triangula su techo (ear-cutting, admite poligonos concavos) y se extruye desde una base tomada del relieve hasta base+altura, formando un prisma cerrado (techo + muros). Un id por vertice enlaza cada triangulo con su registro de edificio, y los atributos por edificio (altura, fuente de altura, cobertura, area de huella, num. de pisos, funcion, forma de techo, mas las capas analiticas muestreadas) viajan en el glTF, así el visor recolorea, filtra y selecciona por cualquier atributo sin recomputar. Las calles se buferizan por ancho según su clase y se drapean sobre el relieve.',
        )}
      </p>
      <Equation
        tex={String.raw`z \in [\,b_i,\ b_i + h_i\,], \quad b_i = \text{DSM}(\text{centroid}_i), \quad a_i = \text{area}(\text{footprint}_i)`}
        caption={t('Every prism rises from the terrain-sampled base b to b+h; the footprint area a is carried as an attribute.',
          'Cada prisma sube desde la base b tomada del relieve hasta b+h; el area de huella a viaja como atributo.')}
      />
      <Fig viewBox="0 0 520 150" caption={t('Footprint to closed prism; a per-vertex id keeps each building selectable + attributed.',
        'De la huella al prisma cerrado; un id por vertice mantiene cada edificio seleccionable y con atributos.')}>
        <polygon className="f-bx" points="40,110 96,120 110,86 60,74" />
        <text className="f-mu" x="46" y="140">{t('footprint', 'huella')}</text>
        <path className="f-ln-a" d="M150 92 L186 92" markerEnd="url(#ar4)" />
        <defs><marker id="ar4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
        <g transform="translate(210,0)">
          <polygon className="f-bx-a" points="40,70 96,80 110,46 60,34" />
          <path className="f-bx" d="M40 70 L40 110 L96 120 L96 80 Z" />
          <path className="f-bx" d="M96 80 L110 46 L110 86 L96 120 Z" />
          <text className="f-mu" x="46" y="140">{t('prism (roof + walls)', 'prisma (techo + muros)')}</text>
        </g>
        <g transform="translate(380,0)">
          <rect className="f-bx" x="10" y="40" width="120" height="70" rx="6" />
          <text className="f-tx" x="22" y="62">{t('height, source,', 'altura, fuente,')}</text>
          <text className="f-tx" x="22" y="80">{t('area, function,', 'area, funcion,')}</text>
          <text className="f-tx" x="22" y="98">NDVI, solar, ...</text>
        </g>
      </Fig>
      <Callout variant="honest" title={t('Assumptions / limitations', 'Supuestos / limitaciones')}>
        {t('Footprints are extruded as flat-roof prisms; genuine roof shapes appear only in the authoritative LoD2 ground-truth layer (3DBAG). Height is a single value per building, not a per-storey model.',
          'Las huellas se extruyen como prismas de techo plano; las formas reales de techo aparecen solo en la capa de verdad LoD2 (3DBAG). La altura es un valor unico por edificio, no un modelo por planta.')}
      </Callout>
      <Refs ids={['overture', '3dbag', 'gltf']} label={t('References', 'Referencias')} />
    </div>
  );

  const SATELLITE = (
    <div className="mq-method">
      <p>
        {t(
          'The analytical satellite layer finds the least-cloudy recent Sentinel-2 L2A scene over the AOI through the Earth Search STAC API (no auth), windowed-reads the visible + NIR + SWIR bands from the sentinel-cogs COGs, reprojects them to a WGS84 grid over the AOI, and derives three normalized-difference indices sampled at every building footprint centroid: NDVI (vegetation), NDWI (open water / moisture) and NDBI (built-up / impervious).',
          'La capa satelital analitica encuentra la escena Sentinel-2 L2A reciente con menos nubes sobre el AOI a traves de la API STAC de Earth Search (sin auth), lee por ventana las bandas visibles + NIR + SWIR de los COGs sentinel-cogs, las reproyecta a una grilla WGS84 sobre el AOI, y deriva tres indices de diferencia normalizada muestreados en cada centroide de huella: NDVI (vegetacion), NDWI (agua / humedad) y NDBI (construido / impermeable).',
        )}{' '}
        <Cite id="sentinel2" /> <Cite id="stac" />
      </p>
      <Equation
        tex={String.raw`\mathrm{NDVI}=\frac{\rho_{\text{NIR}}-\rho_{\text{Red}}}{\rho_{\text{NIR}}+\rho_{\text{Red}}}\quad \mathrm{NDWI}=\frac{\rho_{\text{Green}}-\rho_{\text{NIR}}}{\rho_{\text{Green}}+\rho_{\text{NIR}}}\quad \mathrm{NDBI}=\frac{\rho_{\text{SWIR}}-\rho_{\text{NIR}}}{\rho_{\text{SWIR}}+\rho_{\text{NIR}}}`}
        caption={t('Bands B04 (Red), B03 (Green), B08 (NIR, 10 m), B11 (SWIR, 20 m). Each index is in [-1, 1].',
          'Bandas B04 (Rojo), B03 (Verde), B08 (NIR, 10 m), B11 (SWIR, 20 m). Cada indice esta en [-1, 1].')}
      />
      <p>
        {t('These ride as per-building attributes, so they become colour-by, filter and aggregate-by-comuna layers exactly like height or floor count. A true-colour and a false-colour composite are also produced for the optional terrain drape.',
          'Estos viajan como atributos por edificio, así que se vuelven capas de colorear, filtrar y agregar por comuna igual que la altura o el número de pisos. Tambien se producen un compuesto de color real y uno de falso color para el drapeado opcional sobre el relieve.')}
      </p>
      <Fig viewBox="0 0 520 160" caption={t('Reflectance bands to normalized-difference indices, sampled per footprint centroid.',
        'Bandas de reflectancia a indices de diferencia normalizada, muestreados por centroide de huella.')}>
        {[
          { y: 22, l: 'Green (B03)' }, { y: 48, l: 'Red (B04)' }, { y: 74, l: 'NIR (B08)' }, { y: 100, l: 'SWIR (B11)' },
        ].map((b, i) => (
          <g key={i}><rect className="f-bx" x="14" y={b.y} width="150" height="20" rx="4" /><text className="f-tx" x="24" y={b.y + 14}>{b.l}</text></g>
        ))}
        <path className="f-ln-a" d="M164 62 L214 62" markerEnd="url(#ar5)" />
        <defs><marker id="ar5" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
        {['NDVI', 'NDWI', 'NDBI'].map((k, i) => (
          <g key={k}><rect className="f-bx-a" x="222" y={26 + i * 34} width="96" height="26" rx="5" /><text className="f-tx-b" x="236" y={44 + i * 34}>{k}</text></g>
        ))}
        <rect x="360" y="26" width="140" height="14" rx="7" fill="url(#ramp)" />
        <text className="f-mu" x="360" y="58">{t('per-building index ramp', 'rampa de indice por edificio')}</text>
        <defs>
          <linearGradient id="ramp" x1="0" x2="1"><stop offset="0" stopColor="#8a5a2b" /><stop offset="0.5" stopColor="#d8c26a" /><stop offset="1" stopColor="#2e8b57" /></linearGradient>
        </defs>
      </Fig>
      <Callout variant="honest" title={t('Assumptions / limitations', 'Supuestos / limitaciones')}>
        {t('A single-date scene: a cloud over one block leaves a few centroids null (recorded, never interpolated). Indices are surface proxies, not calibrated biophysical variables; a small building samples the reflectance of its 10-20 m block, not its roof alone.',
          'Una escena de una fecha: una nube sobre una manzana deja algunos centroides nulos (registrados, nunca interpolados). Los indices son proxies de superficie, no variables biofisicas calibradas; un edificio pequeño muestrea la reflectancia de su bloque de 10-20 m, no solo su techo.')}
      </Callout>
      <Refs ids={['sentinel2', 'ndvi', 'ndwi', 'ndbi', 'stac']} label={t('References', 'Referencias')} />
    </div>
  );

  const ENVIRONMENT = (
    <div className="mq-method">
      <p>
        {t(
          'The environment layer attaches the geophysical context of the place: solar-energy potential from PVGIS (grid-connected 1 kWp yearly PV yield and annual global horizontal irradiation) and climate normals from the Open-Meteo ERA5 archive (annual mean / coldest / warmest temperature, mean daily-max wind, annual precipitation). Both are no-auth JSON calls.',
          'La capa de ambiente adjunta el contexto geofisico del lugar: potencial de energía solar de PVGIS (rendimiento PV anual de 1 kWp conectado a red e irradiacion horizontal global anual) y normales climaticas del archivo ERA5 de Open-Meteo (temperatura media / mas fria / mas calida anual, viento medio diario máximo, precipitacion anual). Ambos son llamadas JSON sin auth.',
        )}{' '}
        <Cite id="pvgis" /> <Cite id="era5" />
      </p>
      <Equation
        tex={String.raw`\bar T = \frac{1}{N}\sum_{d=1}^{N} T_d, \qquad P_{\text{yr}} = \sum_{d=1}^{N} p_d, \qquad \text{(per-place, and re-sampled at each unit centroid)}`}
        caption={t('Daily ERA5 values reduced to annual normals; solar + climate are sampled once per place and again at each comuna centroid for sub-area aggregation.',
          'Valores diarios ERA5 reducidos a normales anuales; solar + clima se muestrean una vez por lugar y otra en cada centroide de comuna para la agregacion por sub-area.')}
      />
      <Fig viewBox="0 0 520 150" caption={t('One AOI centroid queries PVGIS + Open-Meteo; the same is done per comuna centroid to vary by sub-area.',
        'Un centroide de AOI consulta PVGIS + Open-Meteo; lo mismo por centroide de comuna para variar por sub-area.')}>
        <circle className="f-fill-a" cx="60" cy="70" r="6" />
        <text className="f-mu" x="30" y="98">{t('AOI centroid', 'centroide AOI')}</text>
        <path className="f-ln-a" d="M70 66 L150 44" markerEnd="url(#ar6)" />
        <path className="f-ln-a" d="M70 74 L150 96" markerEnd="url(#ar6)" />
        <defs><marker id="ar6" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
        <rect className="f-bx" x="152" y="30" width="120" height="26" rx="5" /><text className="f-tx" x="164" y="48">PVGIS</text>
        <text className="f-mu" x="278" y="48">{t('solar PV yield, GHI', 'rendimiento PV, GHI')}</text>
        <rect className="f-bx" x="152" y="84" width="120" height="26" rx="5" /><text className="f-tx" x="164" y="102">Open-Meteo</text>
        <text className="f-mu" x="278" y="102">{t('temp, wind, precip', 'temp, viento, precip')}</text>
      </Fig>
      <Callout variant="honest" title={t('Assumptions / limitations', 'Supuestos / limitaciones')}>
        {t('ERA5 is ~25 km, so within one city these are a single climatological point, not a gradient; that is exactly why they are stored per place and aggregated per comuna, where they do vary. Wind is a proxy (mean of daily maxima), and it is one recent year (2023), not a 30-year normal.',
          'ERA5 es ~25 km, así que dentro de una ciudad son un unico punto climatologico, no un gradiente; por eso se guardan por lugar y se agregan por comuna, donde si varian. El viento es un proxy (media de maximos diarios), y es un ano reciente (2023), no una normal de 30 anos.')}
      </Callout>
      <Refs ids={['pvgis', 'era5']} label={t('References', 'Referencias')} />
    </div>
  );

  const SUBAREA = (
    <div className="mq-method">
      <p>
        {t(
          'Sub-area aggregation joins the buildings to official administrative units and summarises any attribute per unit. Boundaries come from geoBoundaries at the finest level that yields two or more units in the AOI (ADM3 comuna/ward/district then ADM2 province/state then ADM1 region). Each building is assigned to its unit by bbox-culled point-in-polygon over its footprint centroid; the tool then colours a choropleth and fills a ranked table.',
          'La agregacion por sub-area une los edificios a unidades administrativas oficiales y resume cualquier atributo por unidad. Los limites vienen de geoBoundaries al nivel mas fino que da dos o mas unidades en el AOI (ADM3 comuna/barrio/distrito, luego ADM2 provincia/estado, luego ADM1 region). Cada edificio se asigna a su unidad por punto-en-poligono con descarte por bbox sobre su centroide; la herramienta colorea un coropleto y llena una tabla ordenada.',
        )}{' '}
        <Cite id="geoboundaries" />
      </p>
      <Equation
        tex={String.raw`\bar x_u = \frac{1}{|B_u|}\sum_{i \in B_u} x_i, \qquad c_u = \frac{\bar x_u - \min_v \bar x_v}{\max_v \bar x_v - \min_v \bar x_v}`}
        caption={t('Building averages per unit u over the buildings B_u; c is the normalized position on the colour ramp. Environment / socio-economic layers use the unit-level value directly, not a building mean.',
          'Promedios de edificios por unidad u sobre los edificios B_u; c es la posicion normalizada en la rampa. Las capas de ambiente / socioeconomicas usan el valor a nivel de unidad, no un promedio de edificios.')}
      />
      <Fig viewBox="0 0 520 150" caption={t('Buildings point-in-polygon into comunas, then a choropleth + ranked table across three layer bands.',
        'Edificios por punto-en-poligono en comunas, luego un coropleto + tabla ordenada en tres bandas de capas.')}>
        <g>
          <rect className="f-ln" x="16" y="20" width="150" height="110" />
          <path className="f-ln" d="M16 74 L166 74 M91 20 L91 130" />
          {[[45, 45], [130, 50], [55, 105], [120, 100], [95, 60]].map((p, i) => <circle key={i} className="f-fill-a" cx={p[0]} cy={p[1]} r="3" />)}
          <text className="f-mu" x="16" y="146">{t('centroids in comunas', 'centroides en comunas')}</text>
        </g>
        <path className="f-ln-a" d="M172 74 L206 74" markerEnd="url(#ar7)" />
        <defs><marker id="ar7" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
        <g transform="translate(212,20)">
          <rect x="0" y="0" width="150" height="110" className="f-ln" />
          <rect x="0" y="0" width="75" height="55" fill="var(--color-accent)" opacity="0.75" />
          <rect x="75" y="0" width="75" height="55" fill="var(--color-accent)" opacity="0.35" />
          <rect x="0" y="55" width="75" height="55" fill="var(--color-accent)" opacity="0.2" />
          <rect x="75" y="55" width="75" height="55" fill="var(--color-accent)" opacity="0.5" />
          <text className="f-mu" x="0" y="126">{t('choropleth', 'coropleto')}</text>
        </g>
        <g transform="translate(392,24)">
          {['Building avg', 'Environment', 'Data Obs.'].map((b, i) => (
            <g key={b}><rect className="f-bx-a" x="0" y={i * 30} width="112" height="22" rx="4" /><text className="f-tx" x="10" y={i * 30 + 15}>{t(b, ['Prom. edificios', 'Ambiente', 'Obs. de Datos'][i])}</text></g>
          ))}
        </g>
      </Fig>
      <Callout variant="honest" title={t('Assumptions / limitations', 'Supuestos / limitaciones')}>
        {t('Cities whose tight AOI sits inside a single unit (e.g. one US county) have no official sub-areas; the draw-polygon Area Statistics tool covers custom sub-areas everywhere. Data Observatory indicators are joined by comuna name and reported as raw counts, not normalized by population or area.',
          'Las ciudades cuyo AOI ajustado cae dentro de una sola unidad (p.ej. un condado de EE.UU.) no tienen sub-areas oficiales; la herramienta de dibujar poligono cubre sub-areas a medida en todas partes. Los indicadores del Observatorio de Datos se unen por nombre de comuna y se reportan como conteos crudos, no normalizados por poblacion o area.')}
      </Callout>
      <Refs ids={['geoboundaries', 'dasymetric']} label={t('References', 'Referencias')} />
    </div>
  );

  const DELIVERY = (
    <div className="mq-method">
      <p>
        {t(
          'Each layer is written as valid binary glTF (.glb); the pipeline then applies meshopt compression (EXT_meshopt_compression) as a delivery step, lossless for the per-vertex id and the per-building attributes, typically ~60% smaller. For few-km AOIs one .glb per layer suffices; the metro-scale scenes (11 km, ~179k buildings) are the heavy case, compressed and streamed with a lightweight LoD proxy first. 3D Tiles (py3dtiles) is the escape hatch if a place exceeds the budget.',
          'Cada capa se escribe como glTF binario (.glb) valido; luego el pipeline aplica compresion meshopt (EXT_meshopt_compression) como paso de entrega, sin perdida para el id por vertice ni los atributos por edificio, tipicamente ~60% mas liviano. Para AOIs de pocos km basta un .glb por capa; las escenas a escala metropolitana (11 km, ~179k edificios) son el caso pesado, comprimidas y transmitidas con un proxy LoD liviano primero. 3D Tiles (py3dtiles) es la via de escape si un lugar excede el presupuesto.',
        )}{' '}
        <Cite id="gltf" />
      </p>
      <Fig viewBox="0 0 520 96" caption={t('Offline bake to one .glb per layer, meshopt-compressed, streamed with an LoD proxy first.',
        'Precalculado offline a un .glb por capa, comprimido con meshopt, transmitido con un proxy LoD primero.')}>
        {[
          { x: 8, en: 'bake (geoscena)', es: 'precalculado (geoscena)' },
          { x: 148, en: '.glb per layer', es: '.glb por capa' },
          { x: 288, en: 'meshopt (-60%)', es: 'meshopt (-60%)' },
          { x: 420, en: 'stream + LoD', es: 'stream + LoD' },
        ].map((r, i) => (
          <g key={i}>
            <rect className="f-bx-a" x={r.x} y="30" width="120" height="34" rx="6" />
            <text className="f-tx" x={r.x + 12} y="51">{t(r.en, r.es)}</text>
            {i < 3 && <path className="f-ln" d={`M${r.x + 120} 47 L${r.x + 140} 47`} markerEnd="url(#ar8)" />}
          </g>
        ))}
        <defs><marker id="ar8" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
      </Fig>
      <Callout variant="note" title={t('Contract', 'Contrato')}>
        {t('meshopt is lossless for the _featureid attribute (picking) and extras.features (per-building data); the manifest is a typed contract mirrored in the frontend, so a schema drift fails the web build.',
          'meshopt es sin perdida para el atributo _featureid (seleccion) y extras.features (datos por edificio); el manifiesto es un contrato tipado espejado en el frontend, así una deriva de esquema rompe el build.')}
      </Callout>
      <Refs ids={['gltf']} label={t('References', 'Referencias')} />
    </div>
  );

  return (
    <section className="page-body prose">
      <h2>{t('Methodology', 'Metodologia')}</h2>
      <p className="mq-lead">
        {t('How open public geodata becomes an interrogable 3D area: feature-level fusion into a local metric frame, a height-provenance ladder, an adaptive terrain mesh, building extrusion, the analytical layers (satellite indices, solar + climate, sub-area aggregation), and web delivery. One method family per tab, each with its equations, a figure and its references.',
          'Como los geodatos publicos abiertos se vuelven un area 3D interrogable: fusion a nivel de caracteristicas en un marco metrico local, una escalera de procedencia de alturas, una malla de relieve adaptativa, extrusion de edificios, las capas analiticas (indices satelitales, solar + clima, agregacion por sub-area) y entrega web. Una familia de métodos por pestana, cada una con sus ecuaciones, una figura y sus referencias.')}
      </p>
      <SubTabs
        ariaLabel={t('Method families', 'Familias de métodos')}
        orientation="vertical"
        tabs={[
          { id: 'fusion', label: t('Fusion & frame', 'Fusion y marco'), content: FUSION },
          { id: 'heights', label: t('Height ladder', 'Escalera de alturas'), content: HEIGHTS },
          { id: 'terrain', label: t('Terrain TIN', 'TIN de relieve'), content: TERRAIN },
          { id: 'buildings', label: t('Buildings & roads', 'Edificios y calles'), content: BUILDINGS },
          { id: 'satellite', label: t('Satellite indices', 'Indices satelitales'), content: SATELLITE },
          { id: 'environment', label: t('Solar & climate', 'Solar y clima'), content: ENVIRONMENT },
          { id: 'subarea', label: t('Sub-area aggregation', 'Agregacion por sub-area'), content: SUBAREA },
          { id: 'delivery', label: t('Web delivery', 'Entrega web'), content: DELIVERY },
        ]}
      />
    </section>
  );
}
