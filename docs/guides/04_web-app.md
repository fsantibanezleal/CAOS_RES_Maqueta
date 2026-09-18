# Guide 04, run, build and deploy the web app

```bash
./scripts/dev.sh            # copies data/derived into frontend/public/data, then starts Vite
cd frontend && npm test     # vitest
cd frontend && npm run build  # copy-data.mjs, tsc --noEmit, vite build into frontend/dist
```

`frontend/public/data` is a build overlay (git-ignored) and is not cleaned between builds; remove it before a
clean build if places were deleted.

## Deploy

`frontend/dist` is a complete static site: the app, `data/index.json`, `data/benchmark.json` and every
bundle. Serve it from the root of a domain or subdomain with a single-page-app fallback to `index.html`
(see [`deploy/maqueta.ml.fasl-work.com.nginx`](../../deploy/maqueta.ml.fasl-work.com.nginx)). The build
uses root-absolute URLs (Vite `base: '/'`), so every route, with or without a trailing slash, loads the
same `/assets/` and `/data/` files; serving from a sub-path would need a different `base`.

- **Full deploy** (the bundles changed): upload the whole `dist/`, about 1.8 GB.
- **App-only deploy** (only code or text changed): upload `index.html` and `assets/` over the existing site.

The data JSON is requested with the app version as a query string, so a new release does not read a stale
cached index. The live instance is <https://maqueta.ml.fasl-work.com>.
