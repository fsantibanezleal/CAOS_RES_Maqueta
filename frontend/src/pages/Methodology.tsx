// Methodology: the fusion methods with formalization (KaTeX). The height-provenance ladder, the local
// metric projection, the adaptive terrain TIN error criterion, and building extrusion. Transcribed
// from CAOS_GeoScena/docs/methods and the persisted research dossiers.
import { Cite, Equation, Refs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Methodology() {
  const es = useShellLang() === 'es';
  return (
    <section className="page-body prose">
      <h2>{es ? 'Metodología' : 'Methodology'}</h2>

      <h3>{es ? '1. El AOI y su marco métrico local' : '1. The AOI and its local metric frame'}</h3>
      <p>
        {es
          ? 'Un Área de Interés se define por un centro WGS84 y un semilado en metros. Todas las capas se expresan en una proyección Acimutal Equidistante local centrada en el centroide del AOI, en metros, con origen (0,0) en el centro. Sobre extensiones de pocos kilómetros la distorsión es muy inferior a un metro, y el visor trabaja directo en metros (Y arriba).'
          : 'An Area of Interest is defined by a WGS84 centre and a half-size in metres. Every layer is expressed in a local Azimuthal Equidistant projection centred on the AOI centroid, in metres, with origin (0,0) at the centre. Over few-kilometre extents distortion is well under a metre, and the viewer works directly in metres (Y-up).'}
      </p>
      <p>{es ? 'En exportación glTF se aplica una sola conversión a Y-arriba:' : 'On glTF export a single Y-up conversion is applied:'}</p>
      <Equation
        tex={String.raw`(x_{\text{glTF}},\,y_{\text{glTF}},\,z_{\text{glTF}}) = (\text{east},\ \text{up},\ -\text{north})`}
        caption={es ? 'Cada .glb comparte esta orientación, así una escena Three.js carga las capas sin corrección por app.' : 'Every .glb shares this orientation, so a Three.js scene loads the layers with no per-app fix-up.'}
      />

      <h3>{es ? '2. La escalera de procedencia de alturas' : '2. The height-provenance ladder'}</h3>
      <p>
        {es
          ? 'Para cada huella, la primera regla que da un valor positivo gana, y se registra la fuente usada:'
          : 'For each footprint, the first rule that yields a positive value wins, and the source used is recorded:'}
      </p>
      <Equation
        tex={String.raw`h_i = \begin{cases} h^{\text{meas}}_i & \text{if } h^{\text{meas}}_i > 0 \quad (\textsf{measured}) \\ n^{\text{floors}}_i \cdot \bar h_{\text{floor}} & \text{else if } n^{\text{floors}}_i > 0 \quad (\textsf{floors}) \\ h^{\text{raster}}_i & \text{else if raster covers } i \quad (\textsf{raster}) \\ h_{\text{prior}} & \text{otherwise} \quad (\textsf{prior}) \end{cases}`}
        caption={es ? 'La escalera: altura medida (Overture/OSM); num. de pisos por altura de piso (3.2 m por defecto); raster de altura (Open Buildings 2.5D, Sur Global); prior por defecto. Con recorte al mínimo de 2.5 m.' : 'The ladder: measured height (Overture/OSM); floor count times floor height (default 3.2 m); height raster (Open Buildings 2.5D, Global South); default prior. Clipped to a 2.5 m minimum.'}
      />
      <p>
        {es
          ? 'La mezcla por lugar (fracción de cada fuente) se hornea y se reporta en el Benchmark: una ciudad rica en OSM es mayoritariamente "medida", mientras que muchas ciudades del Sur Global dependen del raster. Las dos no se presentan como igualmente ciertas.'
          : 'The per-place mix (the fraction from each source) is baked and reported on the Benchmark: an OSM-rich city is mostly "measured", while many Global-South cities lean on the raster. The two are not presented as equally certain.'}{' '}
        <Cite id="overture" /> <Cite id="openbuildings25d" />
      </p>

      <h3>{es ? '3. Malla adaptativa de relieve (Delatin)' : '3. Adaptive terrain mesh (Delatin)'}</h3>
      <p>
        {es
          ? 'La grilla del DEM se convierte en una red irregular de triángulos adaptativa: densa donde el relieve es complejo, dispersa donde es plano. Partiendo de las esquinas, se inserta por rondas el conjunto de puntos de mayor error vertical y se re-triangula hasta que el peor error cae bajo un umbral:'
          : 'The DEM grid becomes an adaptive triangulated irregular network: dense where terrain is complex, sparse where flat. Starting from the corners, it inserts by rounds the set of highest vertical-error points and re-triangulates until the worst error drops below a threshold:'}
      </p>
      <Equation
        tex={String.raw`\max_{p \in \text{grid}} \left| z(p) - \hat z_{\mathcal{T}}(p) \right| \le \varepsilon`}
        caption={es ? 'z es la elevación real; ẑ es la interpolación lineal de la TIN actual. Con inserción por lotes (top-K separados), pasa de miles de triangulaciones a decenas, escalando a muchos lugares.' : 'z is the true elevation; ẑ is the current TIN linear interpolation. With batched insertion (separated top-K), it goes from thousands of triangulations to dozens, scaling across places.'}
      />
      <p>
        {es
          ? 'Delatin produce muchos menos triángulos que una malla de grilla completa para la misma fidelidad. Se implementa en Python puro sobre Delaunay (sin compilador nativo).'
          : 'Delatin produces far fewer triangles than a full-grid mesh for the same fidelity. It is implemented in pure Python over Delaunay (no native compiler).'}{' '}
        <Cite id="delatin" />
      </p>

      <h3>{es ? '4. Extrusión de edificios y cintas de calles' : '4. Building extrusion and road ribbons'}</h3>
      <p>
        {es
          ? 'Cada huella se proyecta a metros, se triangula el techo (ear-cutting, admite polígonos cóncavos) y se extruye desde una base tomada del relieve hasta base+altura formando un prisma cerrado (techo + muros). El color por vértice codifica la altura normalizada; los atributos por edificio (altura, fuente, clase) viajan en el glTF para el lector de valores al hacer clic. Las calles se buferizan por ancho según su clase y se drapean sobre el relieve.'
          : 'Each footprint is projected to metres, the roof is triangulated (ear-cutting, handles concave polygons) and extruded from a terrain-sampled base up to base+height forming a closed prism (roof + walls). Per-vertex colour encodes normalized height; per-building attributes (height, source, class) ride in the glTF for the click value-readout. Roads are buffered by a class half-width and draped on the terrain.'}
      </p>

      <h3>{es ? '5. Entrega web' : '5. Web delivery'}</h3>
      <p>
        {es
          ? 'Cada capa se escribe como glTF binario (.glb) válido; la compresión meshopt/Draco es un paso de entrega (gltfpack). Para AOIs de 2-6 km con decenas de miles de edificios, un .glb por capa basta; 3D Tiles (py3dtiles) es la vía de escape si un lugar excede el presupuesto.'
          : 'Each layer is written as valid binary glTF (.glb); meshopt/Draco compression is a delivery step (gltfpack). For 2-6 km AOIs with tens of thousands of buildings, one .glb per layer suffices; 3D Tiles (py3dtiles) is the escape hatch if a place exceeds the budget.'}{' '}
        <Cite id="gltf" />
      </p>

      <Refs ids={['overture', 'openbuildings25d', 'delatin', 'gltf', 'glo30']} label={es ? 'Referencias' : 'References'} />
    </section>
  );
}
