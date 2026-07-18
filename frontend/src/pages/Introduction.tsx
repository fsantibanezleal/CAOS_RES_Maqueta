// Introduction (ADR-0016 §9C): what Maqueta is, who it is for, the fusion + honesty thesis, the place
// tiers, and an HONEST scope, opened by a theme-aware overview SVG of the whole pipeline. Content
// transcribed from the persisted research dossiers (CAOS_MANAGE/wip/maqueta/), never improvised.
import { Callout, Cite, Figure, Refs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Introduction() {
  const es = useShellLang() === 'es';
  const t = (en: string, esx: string) => (es ? esx : en);
  return (
    <section className="page-body prose">
      <h2>{t('Introduction', 'Introduccion')}</h2>
      <p className="mq-lead">
        {t(
          'Maqueta is a multi-modal fusion tool: it reconstructs real-world areas in interactive 3D by mixing every available modality of open public geodata per place, and then lets you interrogate them, filter and colour buildings by any variable, and aggregate any variable by administrative sub-area. The building height is the entry point, the 3D scaffold the other modalities register onto: terrain, land cover, roads and rail, water, population, and the analytical layers, satellite multispectral indices (vegetation / water / built-up), solar-energy potential, climate normals, and socio-economic indicators. An offline pipeline downloads, fuses, meshes and bakes each place into a static, versioned scene bundle; the web app replays it as an interrogable workbench.',
          'Maqueta es una herramienta de fusión multi-modal: reconstruye áreas reales del mundo en 3D interactivo mezclando cada modalidad disponible de geodatos públicos abiertos por lugar, y luego permite interrogarlas, filtrar y colorear edificios por cualquier variable, y agregar cualquier variable por subárea administrativa. La altura del edificio es el punto de entrada, el andamio 3D sobre el que se registran las demás modalidades: relieve, cobertura de suelo, calles y vías, agua, población, y las capas analíticas, índices multiespectrales satelitales (vegetación / agua / construido), potencial de energía solar, normales climáticas, e indicadores socioeconómicos. Un pipeline offline descarga, fusiona, mallea y precalcula cada lugar en un paquete de escena estático y versionado; la app web lo reproduce como un entorno interrogable.',
        )}
      </p>

      <Figure caption={t('The pipeline: many open sources fused offline into one audited SceneBundle, replayed as an interrogable app. Every layer keeps its source, license and date.',
        'El pipeline: muchas fuentes abiertas fusionadas offline en un SceneBundle auditado, reproducido como app interrogable. Cada capa conserva su fuente, licencia y fecha.')}>
        <svg className="mq-fig-svg" viewBox="0 0 640 210" role="img" preserveAspectRatio="xMidYMid meet">
          <text className="f-tx-b" x="16" y="18">{t('Open public geodata', 'Geodatos públicos abiertos')}</text>
          {['Overture', 'GLO-30 DSM', 'WorldCover', 'Open Buildings 2.5D'].map((s, i) => (
            <g key={s}>
              <rect className="f-bx" x="14" y={30 + i * 34} width="150" height="26" rx="5" />
              <text className="f-mu" x="24" y={47 + i * 34}>{s}</text>
            </g>
          ))}
          {['Sentinel-2', 'PVGIS', 'ERA5 (Open-Meteo)', 'geoBoundaries · Data Obs.'].map((s, i) => (
            <g key={s}>
              <rect className="f-bx-a" x="176" y={30 + i * 34} width="164" height="26" rx="5" />
              <text className="f-mu" x="186" y={47 + i * 34}>{s}</text>
            </g>
          ))}
          <path className="f-ln-a" d="M340 100 L392 100" markerEnd="url(#iar)" />
          <defs><marker id="iar" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
          <rect className="f-bx-a" x="394" y="66" width="110" height="68" rx="8" />
          <text className="f-tx-b" x="406" y="92">geoscena</text>
          <text className="f-mu" x="406" y="110">{t('fuse · mesh', 'fusión · malla')}</text>
          <text className="f-mu" x="406" y="126">{t('· bake', '· precalculado')}</text>
          <path className="f-ln-a" d="M504 100 L536 100" markerEnd="url(#iar)" />
          <rect className="f-bx" x="538" y="66" width="92" height="68" rx="8" />
          <text className="f-tx" x="548" y="92">SceneBundle</text>
          <text className="f-mu" x="548" y="110">.glb / layer</text>
          <text className="f-mu" x="548" y="126">+ manifest</text>
          <text className="f-ac" x="16" y="200">{t('web app: layers · filter · colour · select · aggregate by sub-area', 'app web: capas · filtro · color · selección · agregar por subárea')}</text>
        </svg>
      </Figure>

      <h3>{t('The inspiration, and how Maqueta differs', 'La inspiración, y en qué se diferencia Maqueta')}</h3>
      <p>
        {t('The starting point is Milan Janosov’s work, which reconstructed Manhattan (then Berlin Mitte) as a fully interactive 3D city from OpenStreetMap footprints extruded by height, with shaders and bloom in a single HTML file.',
          'El punto de partida es el trabajo de Milan Janosov, que reconstruyó Manhattan (y luego Berlin-Mitte) como una ciudad 3D totalmente interactiva desde huellas de OpenStreetMap extruidas por su altura, con shaders y bloom en un solo HTML.')}{' '}
        <Cite id="janosov" />{' '}
        {t('Maqueta shares the visual punch but changes the thesis: not a single-source extrusion of one city, but a multi-modal fusion for 100+ curated places, with real terrain, land cover, an honest height-provenance ladder, a benchmark against authoritative LoD2 models, and analytical layers you can filter and aggregate. Where Janosov extrudes one modality, Maqueta uses that height as the anchor and registers every other modality the place has on top of it.',
          'Maqueta comparte el impacto visual pero cambia la tesis: no es una extrusión de una fuente para una ciudad, sino una fusión multi-modal para más de 100 lugares curados, con relieve real, cobertura de suelo, una escalera honesta de procedencia de alturas, un benchmark contra modelos LoD2 autoritativos, y capas analíticas que se pueden filtrar y agregar. Donde Janosov extruye una modalidad, Maqueta usa esa altura como ancla y registra encima todas las demás modalidades que el lugar tenga.')}
      </p>

      <h3>{t('The problem', 'El problema')}</h3>
      <p>
        {t('Extraordinary open geodata exists today but scattered across formats and licenses: Overture conflates 2.5 billion buildings; Copernicus GLO-30 gives global terrain; ESA WorldCover gives 10 m land cover; Sentinel-2 gives multispectral bands; PVGIS and ERA5 give solar and climate. Nobody fuses them into one coherent 3D scene with each datum’s provenance preserved and every variable made filterable and aggregatable.',
          'Hoy existen geodatos abiertos extraordinarios pero dispersos en formatos y licencias distintas: Overture unifica 2.5 mil millones de edificios; Copernicus GLO-30 da relieve global; ESA WorldCover da cobertura a 10 m; Sentinel-2 da bandas multiespectrales; PVGIS y ERA5 dan solar y clima. Nadie los junta en una escena 3D coherente con la procedencia de cada dato preservada y cada variable filtrable y agregable.')}{' '}
        <Cite id="overture" /> <Cite id="glo30" /> <Cite id="worldcover" /> <Cite id="sentinel2" />
      </p>
      <p>
        {t('The second problem is honesty. Most footprints carry no measured height. Guessing one number per building and presenting it confidently turns a scene into part fiction. Maqueta resolves each height from the best available source and records which one was used, so the provenance mix is reported, not hidden, and the same discipline applies to every inferred layer.',
          'El segundo problema es la honestidad. La mayoría de las huellas no traen altura medida. Adivinar un número por edificio y presentarlo con confianza convierte una escena en parte ficción. Maqueta resuelve cada altura con la mejor fuente disponible y registra cuál se usó, para reportar la mezcla en vez de esconderla, y la misma disciplina aplica a cada capa inferida.')}
      </p>

      <h3>{t('The three place tiers', 'Los tres tiers de lugares')}</h3>
      <ul>
        <li>
          <b>{t('A - ground truth', 'A - verdad de terreno')}</b>:{' '}
          {t('places with open LoD2/lidar to compare the fusion against an authoritative model (Amsterdam, Berlin, Manhattan, Tokyo...).',
            'lugares con LoD2/lidar abierto para comparar la fusión contra un modelo autoritativo (Amsterdam, Berlin, Manhattan, Tokio...).')}{' '}
          <Cite id="3dbag" /> <Cite id="usgs3dep" />
        </li>
        <li>
          <b>{t('B - global-fusion cities', 'B - ciudades por fusion global')}</b>:{' '}
          {t('Overture + GLO-30 + WorldCover everywhere; heights via the ladder; the metro cores span official sub-areas for aggregation. Includes Santiago and its 35 comunas plus world metro cores.',
            'Overture + GLO-30 + WorldCover en cualquier parte; alturas por la escalera; los núcleos metropolitanos abarcan subáreas oficiales para agregar. Incluye Santiago y sus 35 comunas más núcleos metropolitanos del mundo.')}
        </li>
        <li>
          <b>{t('C - terrain-first areas', 'C - areas de relieve')}</b>:{' '}
          {t('little or no built-up; terrain, land cover and water carry the scene (Chuquicamata, Atacama, Torres del Paine, Grand Canyon).',
            'poco o nada construido; el relieve, la cobertura y el agua llevan la escena (Chuquicamata, Atacama, Torres del Paine, Gran Cañón).')}
        </li>
      </ul>

      <Callout variant="honest" title={t('Honest scope', 'Alcance honesto')}>
        {t('Maqueta does no photogrammetry or neural reconstruction (NeRF, Gaussian splatting): it is fusion of public vector/raster data. Terrain is a global 30 m DSM that includes buildings and vegetation, so dense cores sit slightly high (the tier-A lidar places show the delta). The satellite indices are single-scene surface proxies; solar and climate are ERA5-resolution (near-constant per AOI, so aggregated per comuna); Data Observatory indicators are Chile-only raw counts. Non-commercial-licensed layers are avoided by default or flagged per scene.',
          'Maqueta no hace fotogrametría ni reconstrucción neural (NeRF, Gaussian splatting): es fusión de datos vectoriales/raster públicos. El relieve es un DSM global de 30 m que incluye edificios y vegetación, así que los centros densos quedan algo altos (los lugares tier-A con lidar muestran la diferencia). Los índices satelitales son proxies de superficie de una sola escena; solar y clima son de resolución ERA5 (casi constantes por AOI, por eso se agregan por comuna); los indicadores del Observatorio de Datos son conteos crudos solo de Chile. Las capas con licencia no comercial se evitan por defecto o se marcan por escena.')}{' '}
        <Cite id="demcompare" />
      </Callout>

      <Refs
        ids={['janosov', 'overture', 'glo30', 'worldcover', 'sentinel2', 'openbuildings25d', 'demcompare', '3dbag', 'usgs3dep']}
        label={t('References', 'Referencias')}
      />
    </section>
  );
}
