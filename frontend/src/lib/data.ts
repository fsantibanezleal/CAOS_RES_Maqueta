// Bundle/index/benchmark loaders. Static replay of the committed CONTRACT-2 artifacts (ADR-0054):
// the app only reads baked bundles under BASE/data. Cache-busted by the app version so a deploy
// doesn't serve a stale index (the GitHub-Pages/CDN stale-data gotcha).
import type { Benchmark, BundleManifest, PlaceIndex } from './contract.types';
import pkg from '../../package.json';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const V = `?v=${pkg.version}`;

export function dataUrl(path: string): string {
  return `${BASE}/data/${path}`;
}

export async function loadIndex(): Promise<PlaceIndex> {
  const r = await fetch(dataUrl(`index.json${V}`));
  if (!r.ok) throw new Error(`index.json ${r.status}`);
  return r.json();
}

export async function loadBenchmark(): Promise<Benchmark> {
  const r = await fetch(dataUrl(`benchmark.json${V}`));
  if (!r.ok) throw new Error(`benchmark.json ${r.status}`);
  return r.json();
}

export async function loadManifest(slug: string): Promise<{ base: string; manifest: BundleManifest }> {
  const base = dataUrl(slug);
  const r = await fetch(`${base}/manifest.json${V}`);
  if (!r.ok) throw new Error(`manifest ${slug} ${r.status}`);
  return { base, manifest: await r.json() };
}
