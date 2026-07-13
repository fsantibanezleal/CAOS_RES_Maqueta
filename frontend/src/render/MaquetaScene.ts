// The Maqueta 3D workbench engine. Loads a place's fused SceneBundle (per-source .glb layers) and
// renders it interactively: per-layer visibility, building colour-by (height / provenance / land use),
// live height + provenance filtering, click-to-select with a 3D highlight, camera presets, neon-road
// glow and an opt-in emissive pulse. Everything is driven from precomputed per-vertex arrays so recolour
// and filter are instant. Compute-safe: render-on-demand loop, rAF auto-throttled when the tab hides.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { BuildingFeature, BundleManifest } from '../lib/contract.types';
import { WORLDCOVER_RGB } from '../lib/labels';

export type ColorMode = 'height' | 'provenance' | 'landuse';
export interface PickInfo {
  feature: BuildingFeature;
  point: THREE.Vector3;
}

const LAYER_ORDER = ['terrain', 'population', 'water', 'green', 'roads', 'rail', 'buildings'];
const SOURCE_CODE: Record<string, number> = { measured: 0, floors: 1, raster: 2, prior: 3 };
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
  private loader = new GLTFLoader();
  private container: HTMLElement;

  private buildingMesh: THREE.Mesh | null = null;
  private buildingMat: THREE.MeshLambertMaterial;
  private features: BuildingFeature[] = [];
  // per-vertex derived arrays (aligned to the building geometry vertex order)
  private vFeature: Int32Array = new Int32Array(0);
  private vHeight: Float32Array = new Float32Array(0);
  private vSource: Uint8Array = new Uint8Array(0);
  private colorByCache: Partial<Record<ColorMode, Float32Array>> = {};
  private highlight: THREE.LineSegments | THREE.Mesh | null = null;

  private colorMode: ColorMode = 'height';
  private heightRange: [number, number] = [0, 1e9];
  private sourceFilter = new Set(['measured', 'floors', 'raster', 'prior']);
  private neon = 1;
  private animate = false;
  private pulse = 0;

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
    const bg = dark ? 0x0a0e14 : 0xdfe6ef;
    this.scene.background = new THREE.Color(bg);
    this.scene.fog = new THREE.Fog(bg, 2600, 9000);
    this.scene.clear();
    this.scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.6 : 0.95));
    const dir = new THREE.DirectionalLight(0xffffff, dark ? 0.7 : 0.9);
    dir.position.set(1, 2, 1.4);
    this.scene.add(dir);
    this.buildingMat.emissiveIntensity = dark ? 0.22 : 0.1;
    for (const obj of this.layers.values()) this.scene.add(obj);
    if (this.highlight) this.scene.add(this.highlight);
    this.needsRender = true;
  }

  async loadBundle(baseUrl: string, manifest: BundleManifest): Promise<void> {
    for (const obj of this.layers.values()) this.scene.remove(obj);
    this.layers.clear();
    this.clearHighlight();
    this.buildingMesh = null;
    this.features = [];
    this.colorByCache = {};

    const ordered = [...manifest.layers].sort(
      (a, b) => LAYER_ORDER.indexOf(a.name) - LAYER_ORDER.indexOf(b.name),
    );
    for (const layer of ordered) {
      const gltf = await this.loader.loadAsync(`${baseUrl}/${layer.file}`);
      const root = gltf.scene;
      root.name = layer.name;
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        floatifyColors(m.geometry as THREE.BufferGeometry);
        if (layer.name === 'buildings') {
          m.material = this.buildingMat;
          this.buildingMesh = m;
          const ud = (gltf.scene.userData ?? {}) as {
            features?: BuildingFeature[];
            extras?: { features?: BuildingFeature[] };
          };
          this.features = ud.features ?? ud.extras?.features ?? [];
          this.deriveBuildingArrays(m.geometry as THREE.BufferGeometry);
        } else {
          m.material = this.layerMaterial(layer.name);
        }
      });
      this.scene.add(root);
      this.layers.set(layer.name, root);
    }
    this.applyColorMode();
    this.applyFilter();
    this.frameCamera(manifest.aoi.size_m);
    this.needsRender = true;
  }

  // Build per-vertex feature id / height / source arrays + a hidden attribute.
  private deriveBuildingArrays(geom: THREE.BufferGeometry) {
    const fidAttr = (geom.getAttribute('_featureid') ||
      geom.getAttribute('_FEATUREID') ||
      geom.getAttribute('featureid')) as THREE.BufferAttribute | undefined;
    const n = geom.getAttribute('position').count;
    const byId = new Map<number, BuildingFeature>();
    this.features.forEach((f) => byId.set(f.id, f));
    this.vFeature = new Int32Array(n);
    this.vHeight = new Float32Array(n);
    this.vSource = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const fid = fidAttr ? Math.round(fidAttr.getX(i)) : -1;
      this.vFeature[i] = fid;
      const f = byId.get(fid);
      this.vHeight[i] = f ? f.height_m : 0;
      this.vSource[i] = f ? (SOURCE_CODE[f.height_source] ?? 3) : 3;
    }
    geom.setAttribute('aHidden', new THREE.BufferAttribute(new Float32Array(n), 1));
  }

  // ---- colour-by ----
  setColorMode(mode: ColorMode) {
    this.colorMode = mode;
    this.applyColorMode();
    this.needsRender = true;
  }

  private applyColorMode() {
    if (!this.buildingMesh) return;
    const geom = this.buildingMesh.geometry as THREE.BufferGeometry;
    let arr = this.colorByCache[this.colorMode];
    if (!arr) {
      const n = this.vHeight.length;
      arr = new Float32Array(n * 3);
      const hmax = Math.max(1, percentile(this.vHeight, 0.95));
      const byId = new Map<number, BuildingFeature>();
      this.features.forEach((f) => byId.set(f.id, f));
      for (let i = 0; i < n; i++) {
        let rgb: [number, number, number];
        if (this.colorMode === 'height') rgb = heightRamp(this.vHeight[i] / hmax);
        else if (this.colorMode === 'provenance') {
          const src = ['measured', 'floors', 'raster', 'prior'][this.vSource[i]];
          rgb = PROVENANCE_RGB[src];
        } else {
          const cls = byId.get(this.vFeature[i])?.class ?? 50;
          rgb = WORLDCOVER_RGB[cls] ?? [120, 120, 120];
        }
        arr[i * 3] = srgbToLinear(rgb[0] / 255);
        arr[i * 3 + 1] = srgbToLinear(rgb[1] / 255);
        arr[i * 3 + 2] = srgbToLinear(rgb[2] / 255);
      }
      this.colorByCache[this.colorMode] = arr;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  // ---- filters ----
  setHeightFilter(min: number, max: number) {
    this.heightRange = [min, max];
    this.applyFilter();
    this.needsRender = true;
  }
  setSourceFilter(sources: Set<string>) {
    this.sourceFilter = sources;
    this.applyFilter();
    this.needsRender = true;
  }
  private applyFilter() {
    if (!this.buildingMesh) return;
    const geom = this.buildingMesh.geometry as THREE.BufferGeometry;
    const hidden = geom.getAttribute('aHidden') as THREE.BufferAttribute;
    const [lo, hi] = this.heightRange;
    const names = ['measured', 'floors', 'raster', 'prior'];
    for (let i = 0; i < this.vHeight.length; i++) {
      const h = this.vHeight[i];
      const okH = h >= lo && h <= hi;
      const okS = this.sourceFilter.has(names[this.vSource[i]]);
      hidden.setX(i, okH && okS ? 0 : 1);
    }
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

  heightBounds(): [number, number] {
    if (!this.vHeight.length) return [0, 100];
    let lo = Infinity;
    let hi = -Infinity;
    for (const h of this.vHeight) {
      if (h < lo) lo = h;
      if (h > hi) hi = h;
    }
    return [Math.floor(lo), Math.ceil(hi)];
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
function percentile(a: Float32Array, p: number): number {
  if (!a.length) return 1;
  const s = Float32Array.from(a).sort();
  return s[Math.floor(p * (s.length - 1))];
}
