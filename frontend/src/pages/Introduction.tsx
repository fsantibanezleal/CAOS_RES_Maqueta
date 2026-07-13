// Introduction: what Maqueta is (a multi-modal fusion reconstruction, not a single-city extrusion
// demo), the fusion thesis (the height map is the entry point other modalities register onto), the
// honesty thesis (provenance-tracked heights), and the scope. Content transcribed from the persisted
// research dossiers (CAOS_MANAGE/wip/maqueta/), never improvised.
import { Cite, Refs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Introduction() {
  const es = useShellLang() === 'es';
  return (
    <section className="page-body prose">
      <h2>{es ? 'Introducción' : 'Introduction'}</h2>
      <p className="mq-lead">
        {es
          ? 'Maqueta es una herramienta de fusión multi-modal: reconstruye y visualiza áreas reales del mundo en 3D interactivo mezclando todas las modalidades de geodatos públicos abiertos disponibles por lugar. El mapa de alturas es el punto de entrada, el andamio 3D sobre el que se registran las demás modalidades: relieve, cobertura de suelo, calles y vías, agua, áreas verdes, densidad de población, y (adaptativo por lugar) verdad de terreno LoD2, alturas 2.5D, uso de suelo, vegetación, clima o energía solar donde el dato público exista. El objetivo no es solo la escena: es entender cómo mezclar información de fuentes heterogéneas. Un pipeline offline descarga, fusiona, mallea y hornea cada lugar en un paquete de escena estático y versionado; la app web lo renderiza con capas conmutables, filtros y coloreo por atributo, y una identidad de shaders (borde Fresnel, líneas de escaneo, pulso radial, calles neón, bloom, cámara orbital).'
          : 'Maqueta is a multi-modal fusion tool: it reconstructs and visualizes real-world areas in interactive 3D by mixing every available modality of open public geodata per place. The height map is the entry point, the 3D scaffold the other modalities register onto: terrain, land cover, roads and rail, water, green areas, population density, and (adaptive per place) LoD2 ground truth, 2.5D heights, land use, vegetation, climate or solar energy wherever the public data exists. The goal is not only the scene: it is understanding how to mix information from heterogeneous sources. An offline pipeline downloads, fuses, meshes and bakes each place into a static, versioned scene bundle; the web app renders it with toggleable layers, per-attribute filters and colouring, and a shader-art identity (Fresnel rim, scan lines, radial pulse, neon roads, bloom, orbital camera).'}
      </p>

      <h3>{es ? 'La inspiración, y en qué se diferencia Maqueta' : 'The inspiration, and how Maqueta differs'}</h3>
      <p>
        {es
          ? 'El punto de partida es el trabajo de Milan Janosov, que reconstruyó Manhattan (y luego Berlín-Mitte) como una ciudad 3D totalmente interactiva desde huellas de OpenStreetMap extruidas por su altura, con shaders y bloom en un solo HTML.'
          : 'The starting point is Milan Janosov’s work, which reconstructed Manhattan (then Berlin Mitte) as a fully interactive 3D city from OpenStreetMap footprints extruded by height, with shaders and bloom in a single HTML file.'}{' '}
        <Cite id="janosov" />{' '}
        {es
          ? 'Maqueta comparte el impacto visual pero cambia la tesis: no es una extrusión de una fuente para una ciudad, sino una FUSIÓN multi-modal para 30-50 lugares curados, con relieve real, cobertura de suelo, y sobre todo una escalera honesta de procedencia de alturas y un benchmark contra modelos LoD2 autoritativos. Donde Janosov extruye una modalidad (huellas por altura), Maqueta usa esa altura como el ancla y registra encima todas las demás modalidades que el lugar tenga disponibles.'
          : 'Maqueta shares the visual punch but changes the thesis: it is not a single-source extrusion of one city, but a multi-modal FUSION for 30-50 curated places, with real terrain, land cover, and above all an honest height-provenance ladder and a benchmark against authoritative LoD2 models. Where Janosov extrudes one modality (footprints by height), Maqueta uses that height as the anchor and registers every other modality the place has available on top of it.'}
      </p>

      <h3>{es ? 'El problema' : 'The problem'}</h3>
      <p>
        {es
          ? 'Hoy existen geodatos abiertos extraordinarios pero dispersos y en formatos y licencias distintas: Overture conflaciona 2.5 mil millones de edificios (OSM, Esri, agencias nacionales, ML de Google/Microsoft); Copernicus GLO-30 da relieve global; ESA WorldCover da cobertura de suelo a 10 m; Google Open Buildings 2.5D da alturas por raster para el Sur Global. Nadie los junta en una escena 3D coherente, con la procedencia de cada dato preservada.'
          : 'Extraordinary open geodata exists today but scattered across formats and licenses: Overture conflates 2.5 billion buildings (OSM, Esri, national agencies, Google/Microsoft ML); Copernicus GLO-30 gives global terrain; ESA WorldCover gives 10 m land cover; Google Open Buildings 2.5D gives raster heights for the Global South. Nobody fuses them into one coherent 3D scene with each datum’s provenance preserved.'}{' '}
        <Cite id="overture" /> <Cite id="glo30" /> <Cite id="worldcover" /> <Cite id="openbuildings25d" />
      </p>
      <p>
        {es
          ? 'El segundo problema es la honestidad. La mayoría de las huellas no traen una altura medida. Adivinar un número por edificio y presentarlo con confianza convierte una escena en parte ficción. Maqueta resuelve cada altura con la mejor fuente disponible y REGISTRA cuál se usó, para reportar la mezcla en vez de esconderla.'
          : 'The second problem is honesty. Most footprints carry no measured height. Guessing one number per building and presenting it confidently turns a scene into part fiction. Maqueta resolves each height from the best available source and RECORDS which one was used, so the provenance mix is reported, not hidden.'}
      </p>

      <h3>{es ? 'Qué hace Maqueta' : 'What Maqueta does'}</h3>
      <p>
        {es
          ? 'Por cada Área de Interés (AOI): descarga las capas disponibles de su fuente autoritativa, las fusiona en un marco métrico local (metros, Y arriba), las mallea (TIN adaptativa de relieve, prismas de edificios, cintas de calles), asigna alturas por la escalera de procedencia, y escribe un SceneBundle (un .glb por capa + un manifiesto con fuente, licencia y fecha por capa). La app solo reproduce esos paquetes auditados: es una proyección de solo lectura de artefactos verificados.'
          : 'For each Area of Interest (AOI): it downloads the available layers from their authoritative source, fuses them into a local metric frame (metres, Y-up), meshes them (adaptive terrain TIN, building prisms, road ribbons), assigns heights via the provenance ladder, and writes a SceneBundle (one .glb per layer + a manifest with per-layer source, license and date). The app only replays these audited bundles: it is a read-only projection of verified artifacts.'}
      </p>

      <h3>{es ? 'Los tres tiers de lugares' : 'The three place tiers'}</h3>
      <ul>
        <li>
          <b>{es ? 'A - verdad de terreno' : 'A - ground truth'}</b>:{' '}
          {es
            ? 'lugares con LoD2/lidar abierto para comparar la fusión contra un modelo autoritativo (Amsterdam, Berlín, Manhattan, Tokio...).'
            : 'places with open LoD2/lidar to compare the fusion against an authoritative model (Amsterdam, Berlin, Manhattan, Tokyo...).'}{' '}
          <Cite id="3dbag" /> <Cite id="usgs3dep" />
        </li>
        <li>
          <b>{es ? 'B - ciudades por fusión global' : 'B - global-fusion cities'}</b>:{' '}
          {es
            ? 'Overture + GLO-30 + WorldCover en cualquier parte; alturas por la escalera. Incluye Santiago, Valparaíso y Concepción.'
            : 'Overture + GLO-30 + WorldCover everywhere; heights via the ladder. Includes Santiago, Valparaiso and Concepcion.'}
        </li>
        <li>
          <b>{es ? 'C - áreas de relieve' : 'C - terrain-first areas'}</b>:{' '}
          {es
            ? 'poco o nada construido; el relieve, la cobertura y el agua llevan la escena (Chuquicamata, Atacama, Torres del Paine, Gran Cañón).'
            : 'little or no built-up; terrain, land cover and water carry the scene (Chuquicamata, Atacama, Torres del Paine, Grand Canyon).'}
        </li>
      </ul>

      <h3>{es ? 'Alcance honesto' : 'Honest scope'}</h3>
      <p>
        {es
          ? 'Maqueta v1 no hace fotogrametría ni reconstrucción neural (NeRF, Gaussian splatting): es fusión de datos vectoriales/raster públicos. El relieve viene de un DSM global de 30 m que incluye edificios y vegetación, por lo que en centros densos el suelo queda algo alto; en los lugares tier-A con lidar se muestra la diferencia. Las capas con licencia no comercial (FABDEM, mosaicos EOX recientes) se evitan por defecto o se marcan por escena.'
          : 'Maqueta v1 does no photogrammetry or neural reconstruction (NeRF, Gaussian splatting): it is fusion of public vector/raster data. Terrain comes from a global 30 m DSM that includes buildings and vegetation, so dense cores sit slightly high; the tier-A lidar places show the delta. Non-commercial-licensed layers (FABDEM, recent EOX mosaics) are avoided by default or flagged per scene.'}{' '}
        <Cite id="demcompare" />
      </p>

      <Refs
        ids={['janosov', 'overture', 'glo30', 'worldcover', 'openbuildings25d', 'demcompare', '3dbag', 'usgs3dep']}
        label={es ? 'Referencias' : 'References'}
      />
    </section>
  );
}
