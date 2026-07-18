// Implementation (ADR-0016 §9C): the concrete system as vertical sub-tabs, the reusable geoscena package,
// the staged pipeline (with an architecture SVG + the analytical fetchers), the two data contracts, the
// replay-only app, and deploy. Transcribed from the repos' docs.
import { Callout, Cite, Figure, Refs, SubTabs, useShellLang } from '@fasl-work/caos-app-shell';
import type { ReactNode } from 'react';

export default function Implementation() {
  const es = useShellLang() === 'es';
  const t = (en: string, esx: string) => (es ? esx : en);

  const PACKAGES: ReactNode = (
    <div className="mq-method">
      <p>
        {t(
          'The reusable, product-agnostic core is the Python package geoscena (Apache-2.0, on PyPI): it takes an AOI and produces a fused, meshed SceneBundle. Maqueta (the product) contributes place curation, styling, benchmarks and the web app. Extracting the reusable capability as a package, rather than leaving it buried in one product, is the house rule.',
          'El nucleo reutilizable y agnostico del producto es el paquete Python geoscena (Apache-2.0, en PyPI): toma un AOI y produce un SceneBundle fusionado y malleado. Maqueta (el producto) aporta la curaduria de lugares, el estilo, los benchmarks y la app web. Extraer la capacidad reutilizable como paquete, en vez de dejarla enterrada en un producto, es la regla de la casa.',
        )}
      </p>
      <pre className="mq-code"><code>{`pip install geoscena[overture,osm]

from geoscena.aoi import AOI
from geoscena.build import BuildConfig, build_scene
aoi = AOI.from_center("Santiago Centro", -70.65, -33.437, 1400)
bundle = build_scene(aoi, BuildConfig(fetched="2026-07-14"))
bundle.write("out/santiago")  # terrain/buildings/roads.glb + manifest.json (with environment + modalities)`}</code></pre>
      <Refs ids={['overture', 'gltf']} label={t('References', 'Referencias')} />
    </div>
  );

  const PIPELINE: ReactNode = (
    <div className="mq-method">
      <p>
        {t(
          'maquetalab bakes each registry place by calling geoscena: fetch every modality from its authoritative source, fuse, mesh, export and meshopt-compress. Geometric fetchers: Overture (footprints/roads), GLO-30 DSM and WorldCover (COG windowed reads via GDAL /vsicurl, keyless), OSM context (Overpass), GHS-POP, Open Buildings 2.5D heights, 3DBAG LoD2. Analytical fetchers: Sentinel-2 L2A via the Earth Search STAC (NDVI/NDWI/NDBI), environment via PVGIS + Open-Meteo, and gen_admin joining geoBoundaries sub-areas + the Data Observatory indicators. It is layer-tolerant: a natural area with no buildings bakes its terrain and records the gap rather than failing.',
          'maquetalab hornea cada lugar del registro llamando a geoscena: descarga cada modalidad de su fuente autoritativa, fusiona, mallea, exporta y comprime con meshopt. Fetchers geometricos: Overture (huellas/calles), GLO-30 DSM y WorldCover (lecturas COG por ventana via GDAL /vsicurl, sin credenciales), contexto OSM (Overpass), GHS-POP, alturas 2.5D de Open Buildings, LoD2 de 3DBAG. Fetchers analiticos: Sentinel-2 L2A via STAC de Earth Search (NDVI/NDWI/NDBI), ambiente via PVGIS + Open-Meteo, y gen_admin uniendo sub-areas de geoBoundaries + los indicadores del Observatorio de Datos. Es tolerante a capas: un area natural sin edificios hornea su relieve y registra el hueco en vez de fallar.',
        )}{' '}
        <Cite id="overture" /> <Cite id="sentinel2" /> <Cite id="pvgis" /> <Cite id="geoboundaries" />
      </p>
      <Figure caption={t('Two lanes: a heavy offline bake (fetch, fuse, mesh, analytical layers, meshopt) and a light static replay. The manifest is the contract between them.',
        'Dos carriles: un precálculo offline pesado (descarga, fusion, malla, capas analiticas, meshopt) y una reproduccion estatica ligera. El manifiesto es el contrato entre ambos.')}>
        <svg className="mq-fig-svg" viewBox="0 0 640 200" role="img" preserveAspectRatio="xMidYMid meet">
          <rect className="f-grid" x="8" y="12" width="624" height="86" rx="8" />
          <text className="f-mu" x="18" y="28">{t('offline bake lane (geoscena + maquetalab)', 'carril de precálculo offline (geoscena + maquetalab)')}</text>
          {[
            { x: 18, en: 'fetch modalities', es: 'descarga modalidades' },
            { x: 152, en: 'fuse (height ladder)', es: 'fusion (escalera)' },
            { x: 300, en: 'mesh (TIN, extrude)', es: 'malla (TIN, extrusion)' },
            { x: 452, en: 'analytical layers', es: 'capas analiticas' },
          ].map((s, i) => (
            <g key={i}>
              <rect className="f-bx-a" x={s.x} y="42" width={i === 2 ? 140 : 128} height="30" rx="6" />
              <text className="f-tx" x={s.x + 10} y="61" style={{ fontSize: 11 }}>{t(s.en, s.es)}</text>
              {i < 3 && <path className="f-ln-a" d={`M${s.x + (i === 2 ? 140 : 128)} 57 L${s.x + (i === 2 ? 152 : 140)} 57`} markerEnd="url(#par)" />}
            </g>
          ))}
          <defs><marker id="par" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path className="f-fill-a" d="M0 0 L6 3 L0 6 Z" /></marker></defs>
          <rect className="f-bx" x="236" y="112" width="168" height="30" rx="6" />
          <text className="f-tx-b" x="252" y="131" style={{ fontSize: 12 }}>SceneBundle + manifest</text>
          <path className="f-ln" d="M320 98 L320 112" markerEnd="url(#par)" />
          <rect className="f-grid" x="8" y="156" width="624" height="36" rx="8" />
          <text className="f-mu" x="18" y="172">{t('static replay lane (React + Three.js, read-only)', 'carril de reproduccion estatica (React + Three.js, solo lectura)')}</text>
          <text className="f-ac" x="18" y="186">{t('layers · filter · colour · select · aggregate by sub-area', 'capas · filtro · color · seleccion · agregar por sub-area')}</text>
          <path className="f-ln" d="M320 142 L320 156" markerEnd="url(#par)" />
        </svg>
      </Figure>
      <Refs ids={['overture', 'sentinel2', 'pvgis', 'era5', 'geoboundaries', 'worldcover']} label={t('References', 'Referencias')} />
    </div>
  );

  const CONTRACTS: ReactNode = (
    <div className="mq-method">
      <p>{t('Two contracts keep every number auditable end to end.', 'Dos contratos mantienen cada número auditable de extremo a extremo.')}</p>
      <ul>
        <li>
          <b>{t('Ingestion (source -> pipeline)', 'Ingesta (fuente -> pipeline)')}</b>:{' '}
          {t('each fetcher returns geometry/raster PLUS a LayerProvenance (source, URL, license, fetch date, method). No layer, and no analytical value, enters without it.',
            'cada fetcher devuelve geometría/raster MAS una LayerProvenance (fuente, URL, licencia, fecha, método). Ninguna capa, ni valor analitico, entra sin ella.')}
        </li>
        <li>
          <b>{t('Artifact (pipeline -> web)', 'Artefacto (pipeline -> web)')}</b>:{' '}
          {t('the SceneBundle manifest.json, a versioned schema carrying layers, modalities, the environment block and credits. A TypeScript type mirrors it in the frontend, so a schema drift fails the web build.',
            'el manifest.json del SceneBundle, un esquema versionado que lleva capas, modalidades, el bloque de ambiente y creditos. Un tipo TypeScript lo espeja en el frontend, así una deriva de esquema rompe el build.')}
        </li>
      </ul>
      <Callout variant="strong" title={t('Honesty by construction', 'Honestidad por construccion')}>
        {t('Because the web can only read a shape the pipeline actually produces, and every value carries its source, the app can never silently ship a fabricated or unsourced number.',
          'Como la web solo puede leer una forma que el pipeline realmente produce, y cada valor lleva su fuente, la app nunca puede publicar en silencio un número inventado o sin fuente.')}
      </Callout>
    </div>
  );

  const APP: ReactNode = (
    <div className="mq-method">
      <p>
        {t(
          'The frontend (React + Three.js over the shared @fasl-work/caos-app-shell) is a read-only projection of the audited baked bundles. It loads each .glb with GLTFLoader, registers the meshopt decoder, applies the scene materials, and picks by raycast reading the _featureid vertex attribute to resolve a building and read its fused attributes. The control panel drives colour-by, per-attribute filters, the area-statistics tool, the satellite drape, and the aggregate-by-admin-area choropleth. The render loop is paused by default and halts on a hidden tab, so there is no compute bomb.',
          'El frontend (React + Three.js sobre el shell compartido @fasl-work/caos-app-shell) es una proyeccion de solo lectura de los bundles precalculados y auditados. Carga cada .glb con GLTFLoader, registra el decodificador meshopt, aplica los materiales de la escena, y hace picking por raycast leyendo el atributo de vertice _featureid para resolver un edificio y leer sus atributos fusionados. El panel de control maneja el coloreo, los filtros por atributo, la herramienta de estadisticas de area, el drapeado satelital, y el coropleto de agregar por area administrativa. El bucle de render esta pausado por defecto y se detiene con la pestana oculta, así no hay bomba de computo.',
        )}{' '}
        <Cite id="gltf" />
      </p>
      <Refs ids={['gltf']} label={t('References', 'Referencias')} />
    </div>
  );

  const DEPLOY: ReactNode = (
    <div className="mq-method">
      <p>
        {t(
          'Static product: the pipeline bakes every place offline on the local machine (raw data on an out-of-git volume, with an on-disk fetch cache so re-bakes are fast), and the site is served as pure static files by nginx over HTTPS. Because the baked bundles are large (metro cores reach tens of MB each), Maqueta lives on the ml/heavy box (more disk), not the memory-bound production box, and deploys via a staging directory plus atomic swap so the live site is never half-written.',
          'Producto estático: el pipeline hornea cada lugar offline en la maquina local (datos crudos en un volumen fuera de git, con un cache de descarga en disco para que los re-precalculados sean rapidos), y el sitio se sirve como archivos estaticos puros por nginx sobre HTTPS. Como los bundles precalculados son grandes (los nucleos metropolitanos llegan a decenas de MB cada uno), Maqueta vive en el box ml/heavy (mas disco), no en el box de produccion limitado por memoria, y despliega via un directorio de staging mas un intercambio atómico para que el sitio en vivo nunca quede a medio escribir.',
        )}
      </p>
    </div>
  );

  return (
    <section className="page-body prose">
      <h2>{t('Implementation', 'Implementacion')}</h2>
      <p className="mq-lead">
        {t('The concrete system: a reusable geoscena package and a maquetalab pipeline that bakes every place offline into an audited SceneBundle, two data contracts that keep every value sourced, a read-only web app that only replays those bundles, and a static deploy.',
          'El sistema concreto: un paquete geoscena reutilizable y un pipeline maquetalab que hornea cada lugar offline en un SceneBundle auditado, dos contratos de datos que mantienen cada valor con fuente, una app web de solo lectura que solo reproduce esos bundles, y un despliegue estático.')}
      </p>
      <SubTabs
        ariaLabel={t('Implementation topics', 'Temas de implementacion')}
        orientation="vertical"
        tabs={[
          { id: 'packages', label: t('Package & product', 'Paquete y producto'), content: PACKAGES },
          { id: 'pipeline', label: t('Staged pipeline', 'Pipeline por etapas'), content: PIPELINE },
          { id: 'contracts', label: t('Data contracts', 'Contratos de datos'), content: CONTRACTS },
          { id: 'app', label: t('The app (replay)', 'La app (reproduccion)'), content: APP },
          { id: 'deploy', label: t('Deployment', 'Despliegue'), content: DEPLOY },
        ]}
      />
    </section>
  );
}
