// In-app Architecture / "How it was built" modal (ADR-0058). Five hand-authored, theme-aware SVG
// diagrams meeting the FLOOR: a shared <style> class vocabulary, type-coded boxes with real module
// paths in monospace, labeled flows, bands/lanes. Every colour is a CSS-variable token so the diagrams
// follow light/dark. Content is the CURRENT system (geoscena core + maquetalab pipeline + Three.js app).
import type { ArchitectureConfig } from '@fasl-work/caos-app-shell';

const STYLE = `
  .arch-svg text { font-family: Inter, "Segoe UI", system-ui, sans-serif; }
  .arch-svg .mono { font-family: ui-monospace, Consolas, monospace; }
  .arch-svg .bx { fill: var(--color-surface-2, #1116); stroke: var(--color-border, #8884); stroke-width: 1.2; }
  .arch-svg .bx-web { stroke: var(--mq-web, #6cc8ff); stroke-width: 1.7; }
  .arch-svg .bx-compute { stroke: var(--mq-compute, #b48cff); stroke-width: 1.7; }
  .arch-svg .bx-store { stroke: var(--mq-store, #57d9a3); stroke-width: 1.7; }
  .arch-svg .bx-pkg { stroke: var(--mq-pkg, #ffb454); stroke-width: 1.7; }
  .arch-svg .bx-src { stroke: var(--mq-src, #ff7b9c); stroke-width: 1.7; }
  .arch-svg .grp { fill: none; stroke: var(--color-border, #8884); stroke-dasharray: 5 4; }
  .arch-svg .hd { fill: var(--color-fg, #eee); font-size: 15px; font-weight: 600; }
  .arch-svg .ttl { fill: var(--color-fg, #eee); font-size: 12px; font-weight: 600; }
  .arch-svg .sub { fill: var(--color-fg-subtle, #999); font-size: 10px; }
  .arch-svg .it { fill: var(--color-fg, #eee); font-size: 10.5px; }
  .arch-svg .cd { fill: var(--color-accent, #6cf); font-size: 9.3px; }
  .arch-svg .mu { fill: var(--color-fg-subtle, #999); font-size: 9.6px; }
  .arch-svg .flow { fill: none; stroke: var(--color-fg-subtle, #999); stroke-width: 1.5; }
  .arch-svg .lbl { fill: var(--color-fg-subtle, #999); font-size: 9.2px; }
`;

const svg = (id: string, h: number, inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 ${h}" width="880" class="arch-svg" role="img">` +
  `<style>${STYLE}</style>` +
  `<defs><marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
  `<path d="M0,0 L8,4 L0,8 z" fill="var(--color-fg-subtle,#999)"/></marker></defs>${inner}</svg>`;

const APP = svg('mq-a1', 300, `
  <text class="hd" x="20" y="30">Maqueta &#183; fuse open geodata into an honest 3D area</text>
  <rect class="grp" x="14" y="46" width="852" height="238" rx="10"/>
  <rect class="bx bx-src" x="28" y="66" width="150" height="200" rx="9"/>
  <text class="ttl" x="40" y="88">open sources</text>
  <text class="mu" x="40" y="108">Overture buildings/roads</text>
  <text class="mu" x="40" y="124">Copernicus GLO-30 DSM</text>
  <text class="mu" x="40" y="140">ESA WorldCover 10 m</text>
  <text class="mu" x="40" y="156">OpenStreetMap context</text>
  <text class="mu" x="40" y="172">Open Buildings 2.5D</text>
  <text class="mu" x="40" y="188">USGS 3DEP / LoD2</text>
  <text class="cd mono" x="40" y="214">geoscena.fetch.*</text>
  <path class="flow" d="M180,166 L214,166" marker-end="url(#mq-a1)"/>
  <rect class="bx bx-pkg" x="216" y="86" width="200" height="160" rx="9"/>
  <text class="ttl" x="228" y="108">geoscena (PyPI pkg)</text>
  <text class="it" x="228" y="130">fuse: height ladder</text>
  <text class="it" x="228" y="148">mesh: terrain TIN,</text>
  <text class="it" x="228" y="163">extrusion, ribbons</text>
  <text class="it" x="228" y="181">export: GLB + manifest</text>
  <text class="cd mono" x="228" y="214">build_scene(aoi, cfg)</text>
  <text class="cd mono" x="228" y="230">-> SceneBundle</text>
  <path class="flow" d="M418,166 L452,166" marker-end="url(#mq-a1)"/>
  <rect class="bx bx-store" x="454" y="106" width="160" height="120" rx="9"/>
  <text class="ttl" x="466" y="128">baked bundle</text>
  <text class="mu" x="466" y="150">terrain/buildings/</text>
  <text class="mu" x="466" y="165">roads/water/... .glb</text>
  <text class="mu" x="466" y="183">manifest.json</text>
  <text class="cd mono" x="466" y="210">data/derived/&lt;slug&gt;</text>
  <path class="flow" d="M614,166 L648,166" marker-end="url(#mq-a1)"/>
  <rect class="bx bx-web" x="650" y="106" width="196" height="120" rx="9"/>
  <text class="ttl" x="662" y="128">Three.js viewer</text>
  <text class="mu" x="662" y="150">shader-art render +</text>
  <text class="mu" x="662" y="165">raycast readout</text>
  <text class="mu" x="662" y="183">read-only replay</text>
  <text class="cd mono" x="662" y="210">frontend/ (shell)</text>
`);

const LANES = svg('mq-a2', 250, `
  <text class="hd" x="20" y="30">Two lanes: heavy offline bake, light static replay</text>
  <rect class="grp" x="14" y="46" width="418" height="188" rx="10"/>
  <text class="sub" x="28" y="66" style="font-weight:600;">OFFLINE (local machine + E:\\_Datos\\maqueta)</text>
  <rect class="bx bx-compute" x="28" y="78" width="180" height="140" rx="9"/>
  <text class="ttl" x="40" y="100">maquetalab.pipeline</text>
  <text class="mu" x="40" y="122">fetch (network, keyless)</text>
  <text class="mu" x="40" y="138">fuse + mesh (heavy)</text>
  <text class="mu" x="40" y="154">geoscena[overture,osm]</text>
  <text class="mu" x="40" y="170">raw data never in git</text>
  <text class="cd mono" x="40" y="200">.venv-pipeline</text>
  <path class="flow" d="M208,148 L242,148" marker-end="url(#mq-a2)"/>
  <rect class="bx bx-store" x="244" y="98" width="180" height="100" rx="9"/>
  <text class="ttl" x="256" y="120">committed bundles</text>
  <text class="mu" x="256" y="142">glb + manifest per place</text>
  <text class="mu" x="256" y="158">index.json, benchmark.json</text>
  <text class="cd mono" x="256" y="184">data/derived/</text>
  <rect class="grp" x="446" y="46" width="420" height="188" rx="10"/>
  <text class="sub" x="460" y="66" style="font-weight:600;">WEB (static, ml box nginx)</text>
  <rect class="bx bx-web" x="460" y="78" width="392" height="140" rx="9"/>
  <text class="ttl" x="472" y="100">the app replays only</text>
  <text class="mu" x="472" y="122">GLTFLoader + shader materials + EffectComposer bloom</text>
  <text class="mu" x="472" y="140">raycast pick -> _featureid -> building height + provenance</text>
  <text class="mu" x="472" y="158">render loop paused by default; halts on hidden tab</text>
  <text class="mu" x="472" y="176">no in-browser fetch of providers (ADR-0054 replay)</text>
  <text class="cd mono" x="472" y="204">maqueta.ml.fasl-work.com</text>
`);

const WEBFLOW = svg('mq-a3', 230, `
  <text class="hd" x="20" y="30">Web flow: place selector -> bundle -> scene</text>
  <rect class="bx bx-web" x="20" y="56" width="150" height="70" rx="8"/>
  <text class="ttl" x="32" y="80">AppPage</text>
  <text class="mu" x="32" y="100">place selector (by tier)</text>
  <text class="cd mono" x="32" y="118">loadIndex()</text>
  <path class="flow" d="M170,91 L204,91" marker-end="url(#mq-a3)"/>
  <rect class="bx bx-store" x="206" y="56" width="150" height="70" rx="8"/>
  <text class="ttl" x="218" y="80">loadManifest(slug)</text>
  <text class="mu" x="218" y="100">manifest + base url</text>
  <text class="cd mono" x="218" y="118">?v=version cache-bust</text>
  <path class="flow" d="M356,91 L390,91" marker-end="url(#mq-a3)"/>
  <rect class="bx bx-compute" x="392" y="46" width="220" height="90" rx="8"/>
  <text class="ttl" x="404" y="70">MaquetaScene.loadBundle</text>
  <text class="mu" x="404" y="90">per-layer GLTFLoader</text>
  <text class="mu" x="404" y="106">materials + bloom + fog</text>
  <text class="cd mono" x="404" y="126">render/MaquetaScene.ts</text>
  <path class="flow" d="M612,91 L646,91" marker-end="url(#mq-a3)"/>
  <rect class="bx bx-web" x="648" y="56" width="198" height="70" rx="8"/>
  <text class="ttl" x="660" y="80">interactions</text>
  <text class="mu" x="660" y="100">orbit, layers, presets,</text>
  <text class="mu" x="660" y="116">click -> value readout</text>
  <text class="lbl" x="150" y="160">i18n EN/ES + light/dark from the shared shell; ⓘ this modal</text>
`);

const SCIENCE = svg('mq-a4', 250, `
  <text class="hd" x="20" y="30">The science: the height-provenance ladder</text>
  <rect class="bx bx-src" x="20" y="52" width="150" height="150" rx="8"/>
  <text class="ttl" x="32" y="74">footprint i</text>
  <text class="mu" x="32" y="96">Overture polygon</text>
  <text class="mu" x="32" y="112">height? num_floors?</text>
  <text class="cd mono" x="32" y="140">fuse/heights.py</text>
  <path class="flow" d="M170,127 L206,127" marker-end="url(#mq-a4)"/>
  <rect class="bx bx-compute" x="208" y="52" width="300" height="150" rx="8"/>
  <text class="ttl" x="220" y="74">ladder (first positive wins)</text>
  <text class="it" x="220" y="98">1. measured  (height &gt; 0)</text>
  <text class="it" x="220" y="116">2. floors    (num_floors x 3.2 m)</text>
  <text class="it" x="220" y="134">3. raster    (Open Buildings 2.5D)</text>
  <text class="it" x="220" y="152">4. prior     (default 8 m)</text>
  <text class="mu" x="220" y="176">records height_source per building</text>
  <text class="cd mono" x="220" y="194">-> height_m, height_source, mix</text>
  <path class="flow" d="M508,127 L544,127" marker-end="url(#mq-a4)"/>
  <rect class="bx bx-store" x="546" y="72" width="300" height="110" rx="8"/>
  <text class="ttl" x="558" y="94">honest report</text>
  <text class="mu" x="558" y="116">per-scene + global mix in Benchmark</text>
  <text class="mu" x="558" y="134">click a building -> which rung</text>
  <text class="mu" x="558" y="152">measured vs inferred never conflated</text>
  <text class="cd mono" x="558" y="172">benchmark.json</text>
`);

const CONTRACTS = svg('mq-a5', 220, `
  <text class="hd" x="20" y="30">Two data contracts, CI-enforced</text>
  <rect class="bx bx-src" x="20" y="54" width="250" height="120" rx="8"/>
  <text class="ttl" x="32" y="78">CONTRACT 1 &#183; ingestion</text>
  <text class="mu" x="32" y="100">every fetcher returns geometry/raster</text>
  <text class="mu" x="32" y="116">+ LayerProvenance (source, url,</text>
  <text class="mu" x="32" y="132">license, fetched, method)</text>
  <text class="cd mono" x="32" y="158">geoscena.provenance</text>
  <path class="flow" d="M270,114 L310,114" marker-end="url(#mq-a5)"/>
  <text class="lbl" x="272" y="106">fuse+mesh</text>
  <rect class="bx bx-store" x="312" y="54" width="250" height="120" rx="8"/>
  <text class="ttl" x="324" y="78">CONTRACT 2 &#183; artifact</text>
  <text class="mu" x="324" y="100">SceneBundle manifest.json</text>
  <text class="mu" x="324" y="116">layers + stats + credits +</text>
  <text class="mu" x="324" y="132">any_noncommercial flag</text>
  <text class="cd mono" x="324" y="158">bundle.to_manifest()</text>
  <path class="flow" d="M562,114 L602,114" marker-end="url(#mq-a5)"/>
  <text class="lbl" x="566" y="106">mirror</text>
  <rect class="bx bx-web" x="604" y="54" width="250" height="120" rx="8"/>
  <text class="ttl" x="616" y="78">TS type mirror</text>
  <text class="mu" x="616" y="100">contract.types.ts</text>
  <text class="mu" x="616" y="116">a drift fails tsc -></text>
  <text class="mu" x="616" y="132">the web cannot ship a</text>
  <text class="mu" x="616" y="148">shape the pipeline lacks</text>
`);

export const architecture: ArchitectureConfig = {
  title_en: 'Architecture / How it was built',
  title_es: 'Arquitectura / Cómo se construyó',
  tabs: [
    {
      id: 'app',
      en: 'The app',
      es: 'La app',
      svg: APP,
      body_en:
        'Maqueta turns open public geodata into an honest 3D area. The geoscena package (on PyPI) fetches each source, fuses them (the height-provenance ladder), meshes them (adaptive terrain TIN, building extrusion, road ribbons) and exports a SceneBundle: one .glb per layer plus a manifest with per-layer source, license and date. The Three.js app only replays those audited bundles.',
      body_es:
        'Maqueta convierte geodatos públicos abiertos en un área 3D honesta. El paquete geoscena (en PyPI) descarga cada fuente, las fusiona (la escalera de procedencia de alturas), las mallea (TIN adaptativa de relieve, extrusión de edificios, cintas de calles) y exporta un SceneBundle: un .glb por capa más un manifiesto con fuente, licencia y fecha por capa. La app Three.js solo reproduce esos paquetes auditados.',
    },
    {
      id: 'lanes',
      en: 'The lanes',
      es: 'Los carriles',
      svg: LANES,
      body_en:
        'Two lanes with separate dependencies. offline: the maquetalab pipeline runs on the local machine with heavy geo libraries, fetching from keyless public buckets and Overpass, meshing, and committing compact bundles; raw data stays on an out-of-git volume. WEB: the static site (nginx on the ml box) loads the committed .glb and replays them. No provider is contacted from the browser (ADR-0054), and the render loop is paused by default.',
      body_es:
        'Dos carriles con dependencias separadas. offline: el pipeline maquetalab corre en la máquina local con librerías geo pesadas, descargando de buckets públicos sin credenciales y de Overpass, malleando y comprometiendo bundles compactos; los datos crudos quedan fuera de git. WEB: el sitio estático (nginx en el box ml) carga los .glb comprometidos y los reproduce. No se contacta ningún proveedor desde el navegador (ADR-0054), y el bucle de render está pausado por defecto.',
    },
    {
      id: 'web',
      en: 'Web flow',
      es: 'Flujo web',
      svg: WEBFLOW,
      body_en:
        'The App page loads the place index, then the selected place manifest (cache-busted by the app version). MaquetaScene loads each layer with GLTFLoader, applies the shader materials (Fresnel rim, neon roads, bloom via EffectComposer, fog) and wires the interactions: orbital camera, per-layer visibility, camera presets, and a raycast pick that reads the _featureid vertex attribute to show a building height + provenance read-out.',
      body_es:
        'La página App carga el índice de lugares y luego el manifiesto del lugar elegido (con cache-bust por versión). MaquetaScene carga cada capa con GLTFLoader, aplica los materiales con shaders (borde Fresnel, calles neón, bloom vía EffectComposer, niebla) y conecta las interacciones: cámara orbital, visibilidad por capa, presets de cámara, y un picking por raycast que lee el atributo de vértice _featureid para mostrar la altura y procedencia del edificio.',
    },
    {
      id: 'science',
      en: 'The science',
      es: 'La ciencia',
      svg: SCIENCE,
      body_en:
        'The height-provenance ladder is the honest core. For each building the first positive rung wins: a measured height, then floor-count times floor-height, then a sampled height raster (Open Buildings 2.5D, which covers the Global South), then a default prior. The rung used is recorded per building and aggregated into a per-scene and global mix, so measured and inferred heights are never conflated.',
      body_es:
        'La escalera de procedencia de alturas es el núcleo honesto. Para cada edificio gana la primera regla positiva: altura medida, luego num. de pisos por altura de piso, luego un raster de altura muestreado (Open Buildings 2.5D, que cubre el Sur Global), luego un prior por defecto. La fuente usada se registra por edificio y se agrega en una mezcla por escena y global, así nunca se confunde lo medido con lo inferido.',
    },
    {
      id: 'contracts',
      en: 'Data contracts',
      es: 'Contratos de datos',
      svg: CONTRACTS,
      body_en:
        'Two contracts keep every number auditable. CONTRACT 1 (ingestion): each fetcher returns geometry/raster plus a LayerProvenance (source, url, license, fetch date, method). CONTRACT 2 (artifact): the SceneBundle manifest, mirrored by a TypeScript type in the frontend, so a schema drift fails the web build. The web can never ship reading a shape the pipeline does not produce.',
      body_es:
        'Dos contratos mantienen cada número auditable. CONTRATO 1 (ingesta): cada fetcher devuelve geometría/raster más una LayerProvenance (fuente, url, licencia, fecha, método). CONTRATO 2 (artefacto): el manifiesto del SceneBundle, espejado por un tipo TypeScript en el frontend, así una deriva de esquema rompe el build. La web nunca puede leer una forma que el pipeline no produce.',
    },
  ],
};
