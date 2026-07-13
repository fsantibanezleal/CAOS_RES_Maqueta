// Delivery-layer glTF compression for baked SceneBundles.
//
// geoscena emits valid but UNCOMPRESSED GLB (it leaves web-delivery compression to the consuming
// product, by design). This step applies EXT_meshopt_compression (+ KHR_mesh_quantization) to every
// layer .glb under data/derived/<place>/, in place. It is lossless for topology and keeps the custom
// `_featureid` picking attribute at full f32 precision (verified: gltf-transform does not quantize it),
// and preserves scene `extras.features` (the per-building attribute payload the viewer reads). The
// frontend GLTFLoader registers MeshoptDecoder, so compressed and uncompressed bundles both load.
//
// Usage:  node tools/compress-bundles.mjs [derivedDir]      (default: <repo>/data/derived)
// Idempotent: re-running re-compresses (meshopt on an already-meshopt file is a no-op-ish reencode).

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// tools/ -> data-pipeline/ -> <repo>/ ; the canonical derived bundles live at <repo>/data/derived.
const derivedDir = resolve(process.argv[2] ?? join(__dirname, '..', '..', 'data', 'derived'));

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

function listGlb(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listGlb(p));
    else if (name.endsWith('.glb')) out.push(p);
  }
  return out;
}

const files = listGlb(derivedDir);
let before = 0;
let after = 0;
let done = 0;
console.log(`compress-bundles: ${files.length} .glb under ${derivedDir}`);

for (const file of files) {
  const b = statSync(file).size;
  try {
    const doc = await io.read(file);
    // meshopt() quantizes geometry (KHR_mesh_quantization) and applies EXT_meshopt_compression.
    // Custom generic attributes (_featureid) are preserved; extras (per-building features) untouched.
    await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
    await io.write(file, doc);
    const a = statSync(file).size;
    before += b;
    after += a;
    done += 1;
    if (a > 1_000_000 || file.includes('buildings')) {
      console.log(`  ${(b / 1e6).toFixed(1)}MB -> ${(a / 1e6).toFixed(1)}MB  ${file.slice(derivedDir.length + 1)}`);
    }
  } catch (e) {
    console.error(`  SKIP ${file}: ${e.message}`);
  }
}

console.log(
  `done: ${done}/${files.length} files, ${(before / 1e6).toFixed(0)}MB -> ${(after / 1e6).toFixed(0)}MB ` +
    `(${before > 0 ? (100 * (1 - after / before)).toFixed(0) : 0}% smaller)`,
);
