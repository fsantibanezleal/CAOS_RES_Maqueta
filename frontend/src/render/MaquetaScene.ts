// The Maqueta 3D viewer: loads a place's SceneBundle (per-layer .glb) and renders it with the
// shader-art identity (Fresnel rim on buildings, emissive neon roads, fog, bloom, orbital camera).
// Geometry arrives in AOI-local metres, Y-up (the geoscena glTF convention), so layers drop straight
// in. Interactions: orbital camera, per-layer visibility, and raycast building picking that resolves
// the _featureid vertex attribute to a building's {height, source}. Compute-bomb-safe: the render loop
// is paused by default (renders on demand + while interacting) and stops when the tab is hidden.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { BuildingFeature, BundleManifest } from '../lib/contract.types';

export interface PickInfo {
  layer: string;
  feature?: BuildingFeature;
  point: THREE.Vector3;
}

const LAYER_ORDER = ['terrain', 'water', 'green', 'roads', 'rail', 'buildings'];

// Fresnel rim + height shading for buildings. Vertex colours carry the height ramp; the rim adds the
// scan-glow edge of the inspiration. `uPulse` animates a radial scan when the user opts into animation.
const BUILDING_VERT = /* glsl */ `
  varying vec3 vColor; varying vec3 vView; varying vec3 vNormalW; varying float vDist;
  #ifdef USE_COLOR
    attribute vec3 color;
  #endif
  void main() {
    #ifdef USE_COLOR
      vColor = color;
    #else
      vColor = vec3(0.4, 0.55, 0.8);
    #endif
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    vDist = length(wp.xz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const BUILDING_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vColor; varying vec3 vView; varying vec3 vNormalW; varying float vDist;
  uniform vec3 uRim; uniform float uPulse; uniform float uPulseOn;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vView))), 2.5);
    vec3 col = vColor + uRim * fres * 0.9;
    // optional radial scan pulse (opt-in)
    float ring = smoothstep(0.02, 0.0, abs(sin(vDist * 0.02 - uPulse)) - 0.9) * uPulseOn;
    col += uRim * ring * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class MaquetaScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private raycaster = new THREE.Raycaster();
  private layers = new Map<string, THREE.Object3D>();
  private buildingMesh: THREE.Mesh | null = null;
  private buildingFeatures: BuildingFeature[] = [];
  private loader = new GLTFLoader();
  private container: HTMLElement;
  private running = false;
  private needsRender = true;
  private animate = false; // pulse animation opt-in (paused by default)
  private pulse = 0;
  private onPick?: (p: PickInfo | null) => void;
  private disposed = false;
  private ro: ResizeObserver;
  private buildingMat: THREE.ShaderMaterial;

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

    this.buildingMat = new THREE.ShaderMaterial({
      vertexShader: BUILDING_VERT,
      fragmentShader: BUILDING_FRAG,
      vertexColors: true,
      uniforms: {
        uRim: { value: new THREE.Color(dark ? 0x6cc8ff : 0x2a6cff) },
        uPulse: { value: 0 },
        uPulseOn: { value: 0 },
      },
    });

    this.setTheme(dark);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.6, 0.2);
    this.composer.addPass(this.bloom);

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
    (this.buildingMat.uniforms.uRim.value as THREE.Color).set(dark ? 0x6cc8ff : 0x2a6cff);
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
        if (layer.name === 'buildings') {
          m.material = this.buildingMat;
          this.buildingMesh = m;
          const extras = (gltf.scene.userData ?? {}) as { features?: BuildingFeature[] };
          this.buildingFeatures = extras.features ?? [];
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
    switch (name) {
      case 'roads':
        return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      case 'rail':
        return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      case 'water':
        return new THREE.MeshStandardMaterial({
          vertexColors: true,
          metalness: 0.6,
          roughness: 0.25,
        });
      case 'green':
        return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
      default: // terrain
        return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
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
    this.buildingMat.uniforms.uPulseOn.value = on ? 1 : 0;
    this.needsRender = true;
  }

  setBloom(strength: number) {
    this.bloom.strength = strength;
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
    let fid = -1;
    const attr = geom.getAttribute('_featureid') as THREE.BufferAttribute | undefined;
    if (attr && hit.face) fid = Math.round(attr.getX(hit.face.a));
    const feature = this.buildingFeatures.find((f) => f.id === fid);
    this.onPick({ layer: 'buildings', feature, point: hit.point.clone() });
    this.needsRender = true;
  };

  private onVisibility = () => {
    if (document.hidden) this.running = false;
    else if (!this.running) this.loop();
  };

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.needsRender = true;
  }

  private loop = () => {
    if (this.disposed || document.hidden) {
      this.running = false;
      return;
    }
    this.running = true;
    this.controls.update();
    if (this.animate) {
      this.pulse += 0.03;
      this.buildingMat.uniforms.uPulse.value = this.pulse;
      this.needsRender = true;
    }
    if (this.needsRender) {
      this.composer.render();
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
