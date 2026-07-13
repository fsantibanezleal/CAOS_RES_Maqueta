# deploy/

Maqueta is a **static site** (ADR-0057 deterministic replay): there is no backend. The offline pipeline
bakes each place into `data/derived/`; the frontend build copies those bundles into `dist/`, which any
static host (nginx, a CDN, object storage) can serve.

## Files

- **`maqueta.ml.fasl-work.com.nginx`** - a sample nginx site (SPA fallback + long-cache for the `.glb`
  bundles, short-cache for the versioned data JSON). Adapt the `server_name` / `root` for your host.
- **`pages.md` / `fasl-*.service` / `domain.nginx`** - dormant template variants (Maqueta uses neither
  GitHub Pages nor the `app/` backend); kept for reference.

## Deploy flow

1. **Bake** locally: `python -m maquetalab.pipeline --fetched <date>` -> `data/derived/` bundles.
2. **Build** the frontend: `cd frontend && npm run build` (its `copy-data.mjs` pulls `data/derived` into
   `public/data`, then Vite builds `dist/`).
3. **Serve** `frontend/dist/` from your static host, and point your domain at it. Because the baked
   bundles are large, a host with generous disk/bandwidth is preferable to a size-limited static-pages
   service.

The live instance runs at **[maqueta.ml.fasl-work.com](https://maqueta.ml.fasl-work.com)**; its
host-specific operational details are kept in the maintainer's private infrastructure notes, not in this
public repository.
