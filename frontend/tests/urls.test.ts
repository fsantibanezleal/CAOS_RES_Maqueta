// The app is served from the root of its domain behind a single-page-app fallback. Relative URLs
// ('./assets/...', './data/...') resolve under the current route, so a deep link with a trailing slash
// such as /benchmark/ asked for /benchmark/assets/index-*.js and got index.html back: the app never
// mounted. Every asset and data URL must therefore be root-absolute. (This file sits outside src/ so
// that tsc, which checks src/, does not pull vite.config.ts into the app's type check.)
import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config';
import { dataUrl } from '../src/lib/data';

describe('artifact and asset URLs', () => {
  it('load the baked data from /data/, whatever the route', () => {
    expect(dataUrl('index.json')).toBe('/data/index.json');
    expect(dataUrl('stgo_providencia')).toBe('/data/stgo_providencia');
  });

  it('build the script and style URLs from a root-absolute base', () => {
    expect(viteConfig.base).toBe('/');
  });
});
