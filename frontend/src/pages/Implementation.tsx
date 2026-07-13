// Implementation: the concrete system. The geoscena package (PyPI), the maquetalab pipeline, the two
// data contracts, the offline lanes, the deploy. Transcribed from the repos' docs.
import { Cite, Refs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Implementation() {
  const es = useShellLang() === 'es';
  return (
    <section className="page-body prose">
      <h2>{es ? 'Implementación' : 'Implementation'}</h2>

      <h3>{es ? 'Dos repos, una frontera limpia' : 'Two repos, one clean boundary'}</h3>
      <p>
        {es
          ? 'El núcleo reutilizable y agnóstico del producto es el paquete Python geoscena (Apache-2.0, publicado en PyPI): toma un AOI y produce un SceneBundle fusionado y malleado. Maqueta (el producto) aporta la curaduría de lugares, el estilo, los benchmarks y la app. Esta separación sigue el ADR-0061: extraer la capacidad reutilizable como paquete en vez de dejarla enterrada.'
          : 'The reusable, product-agnostic core is the Python package geoscena (Apache-2.0, published on PyPI): it takes an AOI and produces a fused, meshed SceneBundle. Maqueta (the product) contributes place curation, styling, benchmarks and the app. This split follows ADR-0061: extract the reusable capability as a package instead of leaving it buried.'}
      </p>
      <pre className="mq-code">
        <code>{`pip install geoscena[overture,osm]

from geoscena.aoi import AOI
from geoscena.build import BuildConfig, build_scene
aoi = AOI.from_center("Santiago Centro", -70.65, -33.437, 1400)
bundle = build_scene(aoi, BuildConfig(fetched="2026-07-12"))
bundle.write("out/santiago")   # terrain.glb, buildings.glb, roads.glb, manifest.json`}</code>
      </pre>

      <h3>{es ? 'El pipeline por etapas' : 'The staged pipeline'}</h3>
      <p>
        {es
          ? 'maquetalab hornea cada lugar del registro (40, en tres tiers) llamando a geoscena: descarga (Overture por su CLI oficial; GLO-30 y WorldCover por lectura COG con ventana vía GDAL vsicurl, sin credenciales; OSM por Overpass), fusión (la escalera de alturas, muestreo de cobertura y de elevación base), malla (TIN de relieve, extrusión, cintas) y exportación (glb + manifiesto). Es tolerante a capas: un área natural sin edificios hornea su relieve y registra el hueco, sin fallar.'
          : 'maquetalab bakes each registry place (40, in three tiers) by calling geoscena: fetch (Overture via its official CLI; GLO-30 and WorldCover via COG windowed reads through GDAL vsicurl, keyless; OSM via Overpass), fuse (the height ladder, land-cover and base-elevation sampling), mesh (terrain TIN, extrusion, ribbons) and export (glb + manifest). It is layer-tolerant: a natural area with no buildings bakes its terrain and records the gap, without failing.'}{' '}
        <Cite id="overture" /> <Cite id="glo30" /> <Cite id="worldcover" />
      </p>

      <h3>{es ? 'Los dos contratos de datos' : 'The two data contracts'}</h3>
      <ul>
        <li>
          <b>{es ? 'Ingesta (fuente -> pipeline)' : 'Ingestion (source -> pipeline)'}</b>:{' '}
          {es
            ? 'cada fetcher devuelve geometría/raster MÁS una procedencia (fuente, URL, licencia, fecha, método). Ninguna capa entra sin ella.'
            : 'each fetcher returns geometry/raster PLUS a provenance (source, URL, license, date, method). No layer enters without it.'}
        </li>
        <li>
          <b>{es ? 'Artefacto (pipeline -> web)' : 'Artifact (pipeline -> web)'}</b>:{' '}
          {es
            ? 'el manifest.json del SceneBundle (esquema versionado). Un tipo TypeScript lo espeja en el frontend, así una deriva rompe el build.'
            : 'the SceneBundle manifest.json (versioned schema). A TypeScript type mirrors it in the frontend, so a drift fails the build.'}
        </li>
      </ul>

      <h3>{es ? 'La app: solo reproduce' : 'The app: replay only'}</h3>
      <p>
        {es
          ? 'El frontend (React + Three.js sobre el shell compartido) es una proyección de solo lectura de los bundles horneados y auditados (ADR-0054, réplica determinista). Carga los .glb con GLTFLoader, aplica materiales con shaders (Fresnel, neón, bloom vía EffectComposer), y hace picking por raycast leyendo el atributo de vértice _featureid para resolver el edificio. El bucle de render está pausado por defecto y se detiene con la pestaña oculta: sin bombas de cómputo.'
          : 'The frontend (React + Three.js over the shared shell) is a read-only projection of the audited baked bundles (ADR-0054, deterministic replay). It loads the .glb with GLTFLoader, applies shader materials (Fresnel, neon, bloom via EffectComposer), and picks by raycast reading the _featureid vertex attribute to resolve the building. The render loop is paused by default and halts on a hidden tab: no compute bombs.'}
      </p>

      <h3>{es ? 'Despliegue' : 'Deployment'}</h3>
      <p>
        {es
          ? 'Producto estático: el pipeline hornea los bundles offline (en la máquina local, con los datos crudos en un volumen fuera de git); el sitio se sirve como estático por nginx. Por el tamaño de los bundles horneados, Maqueta vive en el box ml/heavy (más disco), no en el box de producción.'
          : 'Static product: the pipeline bakes the bundles offline (on the local machine, raw data on an out-of-git volume); the site is served static by nginx. Because of the baked-bundle size, Maqueta lives on the ml/heavy box (more disk), not the production box.'}
      </p>

      <Refs ids={['overture', 'glo30', 'worldcover', 'gltf', 'usgs3dep']} label={es ? 'Referencias' : 'References'} />
    </section>
  );
}
