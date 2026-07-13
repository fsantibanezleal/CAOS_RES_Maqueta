// The Maqueta 3D viewer: loads a place's SceneBundle (per-layer .glb) and renders it with the
// shader-art identity (Fresnel rim on buildings, emissive neon roads, fog, bloom, orbital camera).
// Geometry arrives in AOI-local metres, Y-up (the geoscena glTF convention), so layers drop straight
// in. Interactions: orbital camera, per-layer visibility, and raycast building picking that resolves
// the _featureid vertex attribute to a building's {height, source}. Compute-bomb-safe: the render loop
// is paused by default (renders on demand + while interacting) and stops when the tab is hidden.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { BuildingFeature, BundleManifest } from '../lib/contract.types';

export interface PickInfo {
  layer: string;
  feature?: BuildingFeature;
  point: THREE.Vector3;
}

const LAYER_ORDER = ['terrain', 'water', 'green', 'roads', 'rail', 'buildings'];

// Fresnel rim + height shading for buildings. Vertex colours carry the height ramp; the rim adds the
// scan-glow edge of the inspiration. `uPulse` animates a radial scan when the user opts into animation.
// Building material: a MeshStandardMaterial (three handles the glTF COLOR_0 -> height ramp reliably)
// with an onBeforeCompile Fresnel-rim + radial-scan-pulse injection for the shader-art identity. A raw
// ShaderMaterial does not reliably bind COLOR_0, so we extend the standard material instead.
// Convert a normalized uint8 COLOR_0 attribute (as glTF stores vertex colours) to a plain,
// non-normalized Float32 attribute. Some drivers -- and the SwiftShader software renderer used in
// headless verification -- render normalized-uint8 vertex colours as black; a float attribute is
// portable. glTF colours are sRGB-encoded, so we linearize here since the scene renders in linear space.
function floatifyColors(geom: THREE.BufferGeometry): void {
  const col = geom.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!col || col.array instanceof Float32Array) return;
  const n = col.count;
  const size = col.itemSize;
  const out = new Float32Array(n * size);
  const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < size; k++) {
      const v = (col.array[i * size + k] as number) / 255;
      out[i * size + k] = k < 3 ? srgbToLinear(v) : v;
    }
  }
  geom.setAttribute('color', new THREE.BufferAttribute(out, size));
}

// Building material. We use an UNLIT MeshBasicMaterial (vertex colours = the height ramp) and add all
// shading ourselves via onBeforeCompile: a cheap directional shade from the geometry normal, a Fresnel
// rim, and an opt-in radial scan pulse. This renders identically on every driver (GPU or the SwiftShader
// software renderer used in verification) because it does not depend on the PBR lighting path, which
// SwiftShader does not execute. The look is the stylized neon-extrusion identity of the inspiration.
// Building material. A lit MeshLambertMaterial (vertex colours = the height ramp): unlike MeshStandard's
// PBR path, Lambert lighting renders reliably on all drivers and gives the extrusions face shading so the
// city reads in 3D. The scan-pulse identity rides on an onBeforeCompile emissive-rim add.
// Building material. A lit MeshLambertMaterial with vertex colours (the height ramp): Lambert lighting
// renders reliably on all drivers and gives the extrusions face shading so the city reads in 3D. Emissive
// is tied to the vertex colour so buildings glow slightly (the neon identity) and never crush to black.
function makeBuildingMaterial(dark: boolean): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    vertexColors: true,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: dark ? 0.28 : 0.16,
  });
}

export class MaquetaScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private layers = new Map<string, THREE.Object3D>();
  private buildingMesh: THREE.Mesh | null = null;
  private buildingFeatures: BuildingFeature[] = [];
  private loader = new GLTFLoader();
  private container: HTMLElement;
  private needsRender = true;
  private animate = false; // pulse animation opt-in (paused by default)
  private pulse = 0;
  private onPick?: (p: PickInfo | null) => void;
  private disposed = false;
  private ro: ResizeObserver;
  private buildingMat: THREE.MeshLambertMaterial;

  constructor(container: HTMLElement, dark: boolean) {
    this.container = container;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(52, w / h, 1, 20000);
    this.camera.position.set(900, 700, 900);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.addEventListener('change', () => (this.needsRender = true));

    this.buildingMat = makeBuildingMaterial(dark);

    this.setTheme(dark);

    if (import.meta.env.DEV) (window as unknown as { __mq?: unknown }).__mq = this;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointer);
    this.loop();
  }

  setTheme(dark: boolean) {
    this.scene.background = new THREE.Color(dark ? 0x0a0e14 : 0xdfe6ef);
    this.scene.fog = new THREE.Fog(dark ? 0x0a0e14 : 0xdfe6ef, 1800, 6000);
    this.scene.clear();
    const amb = new THREE.AmbientLight(0xffffff, dark ? 0.55 : 0.9);
    const dir = new THREE.DirectionalLight(0xffffff, dark ? 0.8 : 1.0);
    dir.position.set(1, 2, 1.5);
    this.scene.add(amb, dir);
    this.buildingMat.emissiveIntensity = dark ? 0.28 : 0.14;
    // re-attach loaded layers
    for (const obj of this.layers.values()) this.scene.add(obj);
    this.needsRender = true;
  }

  async loadBundle(baseUrl: string, manifest: BundleManifest): Promise<void> {
    // clear existing
    for (const obj of this.layers.values()) this.scene.remove(obj);
    this.layers.clear();
    this.buildingMesh = null;
    this.buildingFeatures = [];

    const ordered = [...manifest.layers].sort(
      (a, b) => LAYER_ORDER.indexOf(a.name) - LAYER_ORDER.indexOf(b.name),
    );
    for (const layer of ordered) {
      const gltf = await this.loader.loadAsync(`${baseUrl}/${layer.file}`);
      const root = gltf.scene;
      root.name = layer.name;
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!(m as THREE.Mesh).isMesh) return;
        floatifyColors(m.geometry as THREE.BufferGeometry);
        if (layer.name === 'buildings') {
          m.material = this.buildingMat;
          this.buildingMesh = m;
          // trimesh nests our per-feature table under scene extras (scene.userData.extras.features);
          // accept either the nested or the flat shape.
          const ud = (gltf.scene.userData ?? {}) as {
            features?: BuildingFeature[];
            extras?: { features?: BuildingFeature[] };
          };
          this.buildingFeatures = ud.features ?? ud.extras?.features ?? [];
        } else {
          m.material = this.layerMaterial(layer.name);
        }
      });
      this.scene.add(root);
      this.layers.set(layer.name, root);
    }
    this.frameCamera(manifest.aoi.size_m);
    this.needsRender = true;
  }

  private layerMaterial(name: string): THREE.Material {
    // Roads/rail are UNLIT + bright (the neon look); terrain is lit (Lambert) so relief reads via the
    // directional light; water/green are lit Lambert too. Lit materials render reliably on real GPUs.
    switch (name) {
      case 'roads':
      case 'rail':
        return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      case 'water':
        return new THREE.MeshLambertMaterial({ vertexColors: true });
      case 'green':
        return new THREE.MeshLambertMaterial({ vertexColors: true });
      default: // terrain
        return new THREE.MeshLambertMaterial({ vertexColors: true });
    }
  }

  private frameCamera([wm, hm]: [number, number]) {
    const r = Math.max(wm, hm);
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(r * 0.6, r * 0.55, r * 0.6);
    this.camera.far = r * 8;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  setLayerVisible(name: string, visible: boolean) {
    const o = this.layers.get(name);
    if (o) {
      o.visible = visible;
      this.needsRender = true;
    }
  }

  setAnimate(on: boolean) {
    this.animate = on;
    this.needsRender = true;
  }


  cameraPreset(kind: 'aerial' | 'oblique' | 'street') {
    const r = 1200;
    if (kind === 'aerial') this.camera.position.set(0, r * 1.4, 1);
    else if (kind === 'oblique') this.camera.position.set(r * 0.6, r * 0.55, r * 0.6);
    else this.camera.position.set(r * 0.15, 120, r * 0.15);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.needsRender = true;
  }

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
    const hits = this.raycaster.intersectObject(this.buildingMesh, true);
    if (!hits.length) {
      this.onPick(null);
      return;
    }
    const hit = hits[0];
    const geom = (hit.object as THREE.Mesh).geometry as THREE.BufferGeometry;
    // The per-vertex feature id may surface under a few names depending on the loader; try them.
    const attr = (geom.getAttribute('_featureid') ||
      geom.getAttribute('_FEATUREID') ||
      geom.getAttribute('featureid')) as THREE.BufferAttribute | undefined;
    let fid = -1;
    if (attr && hit.face) fid = Math.round(attr.getX(hit.face.a));
    const feature = fid >= 0 ? this.buildingFeatures.find((f) => f.id === fid) : undefined;
    this.onPick({ layer: 'buildings', feature, point: hit.point.clone() });
    this.needsRender = true;
  };

  private onVisibility = () => {
    // Nudge a redraw when the tab becomes visible again (rAF is auto-throttled by the browser while
    // hidden, so the loop itself keeps running -- no compute bomb -- and just idles on needsRender).
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
    // rAF is naturally paused/throttled by the browser when the tab is hidden (no compute bomb), so we
    // do NOT bail on document.hidden here -- bailing would leave the canvas unrendered when the page
    // loads unfocused. We only pause the pulse ANIMATION while hidden.
    this.controls.update();
    if (this.animate && !document.hidden) {
      // gentle emissive breathing (the opt-in "pulse"); runs once-per-frame while visible only.
      this.pulse += 0.03;
      this.buildingMat.emissiveIntensity = 0.2 + 0.12 * Math.abs(Math.sin(this.pulse));
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
