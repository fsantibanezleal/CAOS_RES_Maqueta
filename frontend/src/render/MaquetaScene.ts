// The Maqueta 3D workbench engine. Loads a place's fused SceneBundle (per-source .glb layers) and
// renders it interactively: per-layer visibility, building colour-by (height / provenance / land use),
// live height + provenance filtering, click-to-select with a 3D highlight, camera presets, neon-road
// glow and an opt-in emissive pulse. Everything is driven from precomputed per-vertex arrays so recolour
// and filter are instant. Compute-safe: render-on-demand loop, rAF auto-throttled when the tab hides.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { BuildingFeature, BundleManifest } from '../lib/contract.types';
import { WORLDCOVER_RGB } from '../lib/labels';

export type ColorMode = string; // an attribute key (see ATTRIBUTES)
export interface PickInfo {
  feature: BuildingFeature;
  point: THREE.Vector3;
}

// Generic building-attribute registry: each entry drives colour-by and filtering, so new modalities
// (from the fusion research) plug in by adding a spec + carrying the value on the baked feature.
export interface AttrSpec {
  key: string;
  en: string;
  es: string;
  kind: 'numeric' | 'categorical';
  unit?: string;
  value: (f: BuildingFeature) => number | string | null;
}
export const ATTRIBUTES: AttrSpec[] = [
  { key: 'height', en: 'Height', es: 'Altura', kind: 'numeric', unit: 'm', value: (f) => f.height_m },
  { key: 'provenance', en: 'Height provenance', es: 'Procedencia', kind: 'categorical', value: (f) => f.height_source },
  { key: 'floors', en: 'Floors', es: 'Pisos', kind: 'numeric', value: (f) => f.num_floors ?? null },
  { key: 'area', en: 'Footprint area', es: 'Area de huella', kind: 'numeric', unit: 'm2', value: (f) => f.area_m2 ?? null },
  { key: 'use', en: 'Function', es: 'Funcion', kind: 'categorical', value: (f) => f.use ?? null },
  { key: 'landuse', en: 'Land cover', es: 'Cobertura', kind: 'categorical', value: (f) => (f.class != null ? String(f.class) : null) },
];
export const attrSpec = (key: string) => ATTRIBUTES.find((a) => a.key === key) ?? ATTRIBUTES[0];

// A stable categorical colour palette (distinct hues), plus the fixed provenance/land-cover maps.
const CAT_PALETTE: [number, number, number][] = [
  [66, 133, 244], [219, 68, 55], [244, 180, 0], [15, 157, 88], [171, 71, 188],
  [0, 172, 193], [255, 112, 67], [158, 157, 36], [94, 53, 177], [3, 155, 229],
  [124, 179, 66], [216, 27, 96], [141, 110, 99], [84, 110, 122],
];

const LAYER_ORDER = ['terrain', 'population', 'water', 'green', 'roads', 'rail', 'buildings'];
// Above this building count, edges are not auto-built on load (the user can still enable the wireframe).
const EDGE_AUTO_MAX = 60000;
const PROVENANCE_RGB: Record<string, [number, number, number]> = {
  measured: [46, 158, 111],
  floors: [74, 134, 232],
  raster: [214, 130, 21],
  prior: [154, 162, 173],
};

function heightRamp(t: number): [number, number, number] {
  // blue (low) -> teal -> amber (high)
  const c = Math.max(0, Math.min(1, t));
  return [40 + c * 215, 90 + c * 110, 200 - c * 150];
}

export class MaquetaScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private layers = new Map<string, THREE.Object3D>();
  // GLTFLoader with the Meshopt decoder so EXT_meshopt_compression bundles (the delivery-layer
  // compression the pipeline applies) load; uncompressed bundles still load unchanged.
  private loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  private container: HTMLElement;

  private buildingMesh: THREE.Mesh | null = null;
  private buildingMat: THREE.MeshLambertMaterial;
  private edges: THREE.LineSegments | null = null;
  private edgeMat: THREE.LineBasicMaterial;
  // Wireframe edges give each extrusion a readable 3D shape. On very large scenes (e.g. full Santiago,
  // ~179k buildings) building EdgesGeometry on load would jank the main thread, so edges are deferred:
  // auto-built for scenes up to EDGE_AUTO_MAX buildings, lazily on first enable for larger ones.
  private pendingEdgeGeom: THREE.BufferGeometry | null = null;
  private pendingEdgeParent: THREE.Object3D | null = null;
  private edgesOn = true;
  private features: BuildingFeature[] = [];
  private featuresById = new Map<number, BuildingFeature>();
  private vFeature: Int32Array = new Int32Array(0); // per-vertex building id
  private numRanges = new Map<string, [number, number]>(); // per numeric attr [min,max]
  private catValuesByKey = new Map<string, string[]>(); // per categorical attr distinct values
  private colorCache = new Map<string, Float32Array>();
  private highlight: THREE.LineSegments | THREE.Mesh | null = null;

  private colorMode: string = 'height';
  private numFilters = new Map<string, [number, number]>(); // active numeric filters (AND)
  private catFilters = new Map<string, Set<string>>(); // active categorical filters (AND)
  private neon = 1;
  private animate = false;
  private pulse = 0;
  private dark = false;
  private sceneR = 2000; // scene extent (max AOI side, m); drives fog + camera distance

  private needsRender = true;
  private disposed = false;
  private ro: ResizeObserver;
  private onPick?: (p: PickInfo | null) => void;

  constructor(container: HTMLElement, dark: boolean) {
    this.container = container;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(52, w / h, 1, 40000);
    this.camera.position.set(1400, 1300, 1400);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.addEventListener('change', () => (this.needsRender = true));

    this.buildingMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: dark ? 0.22 : 0.1,
    });
    this.installBuildingFilter(this.buildingMat);
    // Edge lines give each extrusion a readable 3D shape (not a flat colour blob).
    this.edgeMat = new THREE.LineBasicMaterial({
      color: dark ? 0x0a0f16 : 0x2a2f38,
      transparent: true,
      opacity: dark ? 0.5 : 0.35,
    });

    this.setTheme(dark);
    if (import.meta.env.DEV) (window as unknown as { __mq?: unknown }).__mq = this;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointer);
    this.loop();
  }

  // Inject a per-vertex "hidden" flag into the building material so height/provenance filters can
  // discard whole buildings without rebuilding geometry.
  private installBuildingFilter(mat: THREE.MeshLambertMaterial) {
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader =
        'attribute float aHidden;\nvarying float vHidden;\n' +
        shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vHidden = aHidden;');
      shader.fragmentShader =
        'varying float vHidden;\n' +
        shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\n if (vHidden > 0.5) discard;',
        );
    };
  }

  setTheme(dark: boolean) {
    this.dark = dark;
    const bg = dark ? 0x0a0e14 : 0xdfe6ef;
    this.scene.background = new THREE.Color(bg);
    // Fog scales with the scene extent, else large AOIs (full Santiago, 11 km) sit entirely beyond a
    // fixed far-plane and the whole city washes out into the background. Only the far edge hazes.
    this.scene.fog = new THREE.Fog(bg, this.sceneR * 1.1, this.sceneR * 3.0);
    this.scene.clear();
    this.scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.6 : 0.95));
    const dir = new THREE.DirectionalLight(0xffffff, dark ? 0.7 : 0.9);
    dir.position.set(1, 2, 1.4);
    this.scene.add(dir);
    this.buildingMat.emissiveIntensity = dark ? 0.22 : 0.1;
    this.edgeMat.color.set(dark ? 0x0a0f16 : 0x2a2f38);
    this.edgeMat.opacity = dark ? 0.5 : 0.35;
    for (const obj of this.layers.values()) this.scene.add(obj);
    if (this.highlight) this.scene.add(this.highlight);
    this.needsRender = true;
  }

  // Progressive load: the base modalities (terrain, roads, water, green, rail, population) are small and
  // load in ~1 s; the buildings layer can be tens of MB (full Santiago is ~54 MB). So we load and frame
  // the base first, fire `onBaseReady` (the app hides its overlay and the scene is already navigable),
  // then stream the buildings in. The heavy default is interactive in a second instead of ~18 s blank.
  async loadBundle(
    baseUrl: string,
    manifest: BundleManifest,
    onBaseReady?: () => void,
    onProxyReady?: () => void,
  ): Promise<void> {
    for (const obj of this.layers.values()) this.scene.remove(obj);
    this.layers.clear();
    this.clearHighlight();
    this.buildingMesh = null;
    this.edges = null;
    this.pendingEdgeGeom = null;
    this.pendingEdgeParent = null;
    this.features = [];
    this.colorCache.clear();

    const ordered = [...manifest.layers].sort(
      (a, b) => LAYER_ORDER.indexOf(a.name) - LAYER_ORDER.indexOf(b.name),
    );
    const lite = ordered.find((l) => l.name === 'buildings_lite');
    const full = ordered.find((l) => l.name === 'buildings');
    const base = ordered.filter((l) => l.name !== 'buildings' && l.name !== 'buildings_lite');

    // Phase 1: base modalities + frame the camera. Fire onBaseReady NOW so the app hides its overlay the
    // moment terrain + roads are on screen (a couple of MB), the fastest possible first paint.
    for (const layer of base) await this.loadOneLayer(baseUrl, layer);
    this.frameCamera(manifest.aoi.size_m);
    this.needsRender = true;
    onBaseReady?.();

    // Phase 2: the buildings PROXY (the lite LoD if the place has one, else the full layer). This is what
    // makes a heavy scene interactive fast: the ~22k-building lite proxy is a few MB, so the city + all
    // controls light up shortly after the base. onProxyReady lets the app populate the panel.
    const proxy = lite ?? full;
    if (proxy) await this.loadOneLayer(baseUrl, proxy);
    this.applyColor();
    this.applyFilter();
    this.needsRender = true;
    onProxyReady?.();

    // Phase 3: if we showed a lite proxy, stream the FULL buildings in the background and swap it in.
    if (lite && full) {
      const liteRoot = this.layers.get('buildings_lite') ?? null;
      await this.loadOneLayer(baseUrl, full); // buildingMesh/features now point at the full layer
      if (liteRoot) {
        this.scene.remove(liteRoot);
        this.layers.delete('buildings_lite');
        liteRoot.traverse((o) => {
          const mm = o as THREE.Mesh;
          if (mm.isMesh && mm.geometry) (mm.geometry as THREE.BufferGeometry).dispose();
        });
      }
      this.edges = null; // the lite proxy's edges went with its root; the full layer defers edges
      this.clearHighlight(); // a selection made on the lite proxy no longer maps to the full layer
      this.applyColor();
      this.applyFilter();
      this.needsRender = true;
    }
  }

  private async loadOneLayer(baseUrl: string, layer: BundleManifest['layers'][number]): Promise<void> {
    const gltf = await this.loader.loadAsync(`${baseUrl}/${layer.file}`);
    const root = gltf.scene;
    root.name = layer.name;
    const isBuildings = layer.name === 'buildings' || layer.name === 'buildings_lite';
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      floatifyColors(m.geometry as THREE.BufferGeometry);
      if (isBuildings) {
        m.material = this.buildingMat;
        this.buildingMesh = m;
        const ud = (gltf.scene.userData ?? {}) as {
          features?: BuildingFeature[];
          extras?: { features?: BuildingFeature[] };
        };
        this.features = ud.features ?? ud.extras?.features ?? [];
        this.deriveBuildingArrays(m.geometry as THREE.BufferGeometry);
        // Auto-build edges for small/medium scenes; defer for very large ones (built on first enable).
        const geom = m.geometry as THREE.BufferGeometry;
        this.pendingEdgeGeom = geom;
        this.pendingEdgeParent = root;
        this.edgesOn = this.features.length <= EDGE_AUTO_MAX;
        if (this.edgesOn) this.buildEdges(geom, root);
      } else {
        m.material = this.layerMaterial(layer.name);
      }
    });
    this.scene.add(root);
    this.layers.set(layer.name, root);
  }

  // Index features by id, precompute per-attribute ranges/categories, store per-vertex building id.
  private deriveBuildingArrays(geom: THREE.BufferGeometry) {
    const fidAttr = (geom.getAttribute('_featureid') ||
      geom.getAttribute('_FEATUREID') ||
      geom.getAttribute('featureid')) as THREE.BufferAttribute | undefined;
    const n = geom.getAttribute('position').count;
    this.vFeature = new Int32Array(n);
    for (let i = 0; i < n; i++) this.vFeature[i] = fidAttr ? Math.round(fidAttr.getX(i)) : -1;
    this.featuresById = new Map(this.features.map((f) => [f.id, f]));
    this.numRanges.clear();
    this.catValuesByKey.clear();
    for (const spec of ATTRIBUTES) {
      if (spec.kind === 'numeric') {
        let lo = Infinity;
        let hi = -Infinity;
        for (const f of this.features) {
          const v = spec.value(f);
          if (typeof v === 'number' && isFinite(v)) {
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
        }
        this.numRanges.set(spec.key, isFinite(lo) ? [Math.floor(lo), Math.ceil(hi)] : [0, 1]);
      } else {
        const seen = new Set<string>();
        for (const f of this.features) {
          const v = spec.value(f);
          if (v != null) seen.add(String(v));
        }
        this.catValuesByKey.set(spec.key, [...seen].sort());
      }
    }
    this.colorCache.clear();
    geom.setAttribute('aHidden', new THREE.BufferAttribute(new Float32Array(n), 1));
  }

  attributes(): AttrSpec[] {
    // only expose attributes that actually have data in this scene
    return ATTRIBUTES.filter((s) =>
      s.kind === 'numeric'
        ? (this.numRanges.get(s.key)?.[1] ?? 0) > 0
        : (this.catValuesByKey.get(s.key)?.length ?? 0) > 0,
    );
  }
  numericRange(key: string): [number, number] {
    return this.numRanges.get(key) ?? [0, 1];
  }
  categories(key: string): string[] {
    return this.catValuesByKey.get(key) ?? [];
  }

  // ---- colour-by (any attribute) ----
  setColorMode(key: string) {
    this.colorMode = key;
    this.applyColor();
    this.needsRender = true;
  }
  private colorFor(f: BuildingFeature | undefined, spec: AttrSpec, catIdx: Map<string, number>): [number, number, number] {
    if (!f) return [120, 120, 120];
    const v = spec.value(f);
    if (spec.kind === 'numeric') {
      const [lo, hi] = this.numRanges.get(spec.key) ?? [0, 1];
      const t = typeof v === 'number' ? (v - lo) / (hi - lo + 1e-6) : 0;
      return heightRamp(t);
    }
    if (spec.key === 'provenance') return PROVENANCE_RGB[String(v)] ?? [120, 120, 120];
    if (spec.key === 'landuse') return WORLDCOVER_RGB[Number(v)] ?? [120, 120, 120];
    const idx = v == null ? -1 : (catIdx.get(String(v)) ?? -1);
    return idx < 0 ? [140, 140, 140] : CAT_PALETTE[idx % CAT_PALETTE.length];
  }
  private applyColor() {
    if (!this.buildingMesh) return;
    const geom = this.buildingMesh.geometry as THREE.BufferGeometry;
    let arr = this.colorCache.get(this.colorMode);
    if (!arr) {
      const spec = attrSpec(this.colorMode);
      const catIdx = new Map((this.catValuesByKey.get(spec.key) ?? []).map((c, i) => [c, i]));
      const n = this.vFeature.length;
      arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const rgb = this.colorFor(this.featuresById.get(this.vFeature[i]), spec, catIdx);
        arr[i * 3] = srgbToLinear(rgb[0] / 255);
        arr[i * 3 + 1] = srgbToLinear(rgb[1] / 255);
        arr[i * 3 + 2] = srgbToLinear(rgb[2] / 255);
      }
      this.colorCache.set(this.colorMode, arr);
    }
    geom.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  // ---- filters (any attribute, combined with AND) ----
  setNumericFilter(key: string, min: number, max: number) {
    this.numFilters.set(key, [min, max]);
    this.applyFilter();
    this.needsRender = true;
  }
  clearNumericFilter(key: string) {
    this.numFilters.delete(key);
    this.applyFilter();
    this.needsRender = true;
  }
  setCategoricalFilter(key: string, allowed: Set<string>) {
    this.catFilters.set(key, allowed);
    this.applyFilter();
    this.needsRender = true;
  }
  private applyFilter() {
    if (!this.buildingMesh) return;
    const geom = this.buildingMesh.geometry as THREE.BufferGeometry;
    const hidden = geom.getAttribute('aHidden') as THREE.BufferAttribute;
    // precompute per-feature pass/fail (cheap, once per filter change)
    const pass = new Map<number, boolean>();
    for (const f of this.features) {
      let ok = true;
      for (const [key, [lo, hi]] of this.numFilters) {
        const v = attrSpec(key).value(f);
        if (typeof v !== 'number' || v < lo || v > hi) { ok = false; break; }
      }
      if (ok)
        for (const [key, allowed] of this.catFilters) {
          const v = attrSpec(key).value(f);
          if (v == null || !allowed.has(String(v))) { ok = false; break; }
        }
      pass.set(f.id, ok);
    }
    for (let i = 0; i < this.vFeature.length; i++) hidden.setX(i, pass.get(this.vFeature[i]) === false ? 1 : 0);
    hidden.needsUpdate = true;
  }

  // ---- selection ----
  setOnPick(cb: (p: PickInfo | null) => void) {
    this.onPick = cb;
  }
  private onPointer = (ev: PointerEvent) => {
    if (!this.buildingMesh || !this.onPick) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.buildingMesh, true)[0];
    if (!hit || !hit.face) {
      this.clearHighlight();
      this.onPick(null);
      this.needsRender = true;
      return;
    }
    const fid = this.vFeature[hit.face.a];
    const feature = this.features.find((f) => f.id === fid);
    if (feature) {
      this.highlightBuilding(fid);
      this.onPick({ feature, point: hit.point.clone() });
    } else {
      this.clearHighlight();
      this.onPick(null);
    }
    this.needsRender = true;
  };

  // Build a bright wireframe overlay around the selected building's triangles.
  private highlightBuilding(fid: number) {
    this.clearHighlight();
    if (!this.buildingMesh) return;
    const geom = this.buildingMesh.geometry as THREE.BufferGeometry;
    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const pts: number[] = [];
    const idx = geom.index;
    const nFaces = idx ? idx.count / 3 : pos.count / 3;
    for (let f = 0; f < nFaces; f++) {
      const a = idx ? idx.getX(f * 3) : f * 3;
      if (this.vFeature[a] !== fid) continue;
      const b = idx ? idx.getX(f * 3 + 1) : f * 3 + 1;
      const c = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;
      for (const [i, j] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        pts.push(pos.getX(i), pos.getY(i), pos.getZ(i), pos.getX(j), pos.getY(j), pos.getZ(j));
      }
    }
    if (!pts.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.highlight = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color: 0x00e5ff, toneMapped: false, depthTest: false }),
    );
    this.highlight.renderOrder = 999;
    this.scene.add(this.highlight);
  }
  // Build edge lines for the buildings so each extrusion's shape reads in 3D. EdgesGeometry keeps only
  // edges whose adjacent faces differ by > the threshold angle (building corners, roof outlines).
  private buildEdges(geom: THREE.BufferGeometry, parent: THREE.Object3D) {
    try {
      const eg = new THREE.EdgesGeometry(geom, 25);
      this.edges = new THREE.LineSegments(eg, this.edgeMat);
      this.edges.renderOrder = 1;
      parent.add(this.edges); // rides in the buildings group -> toggles + hides with the layer
    } catch {
      this.edges = null;
    }
  }

  // Wireframe state for the panel toggle: whether edges are on, and whether this scene is "large"
  // (edges deferred). The Viewer uses `large` to default the toggle off + show a hint on big scenes.
  edgesInfo(): { on: boolean; large: boolean } {
    return { on: this.edgesOn, large: this.features.length > EDGE_AUTO_MAX };
  }

  // Toggle the building wireframe. Builds the (deferred) edge geometry lazily on first enable.
  setEdges(on: boolean) {
    this.edgesOn = on;
    if (on && !this.edges && this.pendingEdgeGeom && this.pendingEdgeParent) {
      this.buildEdges(this.pendingEdgeGeom, this.pendingEdgeParent);
    }
    if (this.edges) this.edges.visible = on;
    this.needsRender = true;
  }

  private clearHighlight() {
    if (this.highlight) {
      this.scene.remove(this.highlight);
      (this.highlight.geometry as THREE.BufferGeometry).dispose();
      this.highlight = null;
    }
  }

  // ---- scene controls ----
  setLayerVisible(name: string, visible: boolean) {
    const o = this.layers.get(name);
    if (o) {
      o.visible = visible;
      this.needsRender = true;
    }
    // The "buildings" toggle also drives the lite LoD proxy while it stands in for the full layer.
    if (name === 'buildings') {
      const proxy = this.layers.get('buildings_lite');
      if (proxy) proxy.visible = visible;
    }
  }
  setNeon(v: number) {
    this.neon = v;
    for (const [name, obj] of this.layers) {
      if (name === 'roads' || name === 'rail') {
        obj.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
          if (m && 'color' in m) (m as THREE.MeshBasicMaterial).opacity = 1;
        });
      }
    }
    this.buildingMat.emissiveIntensity = 0.1 + v * 0.3;
    this.needsRender = true;
  }
  setAnimate(on: boolean) {
    this.animate = on;
    this.needsRender = true;
  }
  cameraPreset(kind: 'aerial' | 'oblique' | 'street') {
    const r = 1400;
    if (kind === 'aerial') this.camera.position.set(0, r * 1.5, 1);
    else if (kind === 'oblique') this.camera.position.set(r * 0.8, r * 0.75, r * 0.8);
    else this.camera.position.set(r * 0.1, 150, r * 0.1);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.needsRender = true;
  }

  private layerMaterial(name: string): THREE.Material {
    switch (name) {
      case 'roads':
        return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      case 'rail':
        return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      case 'water':
        return new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x001830, emissiveIntensity: 0.3 });
      case 'green':
        return new THREE.MeshLambertMaterial({ vertexColors: true });
      case 'population':
        return new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.75, emissive: 0x000000 });
      default:
        return new THREE.MeshLambertMaterial({ vertexColors: true });
    }
  }

  private frameCamera([wm, hm]: [number, number]) {
    const r = Math.max(wm, hm);
    this.sceneR = r;
    // Re-fit the fog to this scene's extent (the theme set it for the previous scene's size).
    const bg = this.dark ? 0x0a0e14 : 0xdfe6ef;
    this.scene.fog = new THREE.Fog(bg, this.sceneR * 1.1, this.sceneR * 3.0);
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(r * 0.65, r * 0.6, r * 0.65);
    this.camera.far = r * 10;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  private onVisibility = () => {
    if (!document.hidden) this.needsRender = true;
  };
  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.needsRender = true;
  }
  private loop = () => {
    if (this.disposed) return;
    this.controls.update();
    if (this.animate && !document.hidden) {
      this.pulse += 0.03;
      this.buildingMat.emissiveIntensity = 0.15 + 0.15 * Math.abs(Math.sin(this.pulse)) + this.neon * 0.1;
      this.needsRender = true;
    }
    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
    }
    requestAnimationFrame(this.loop);
  };
  dispose() {
    this.disposed = true;
    this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointer);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

}

function floatifyColors(geom: THREE.BufferGeometry): void {
  const col = geom.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!col || col.array instanceof Float32Array) return;
  const n = col.count;
  const size = col.itemSize;
  const out = new Float32Array(n * size);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < size; k++) {
      const v = (col.array[i * size + k] as number) / 255;
      out[i * size + k] = k < 3 ? srgbToLinear(v) : v;
    }
  geom.setAttribute('color', new THREE.BufferAttribute(out, size));
}
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
