# deploy/

Maqueta is a **static site** (ADR-0057 deterministic replay): there is no backend. The offline pipeline
bakes each place into `data/derived/`; the frontend build copies those bundles into `dist/`, which any
static host (nginx, a CDN, object storage) can serve.

## Files

- **`maqueta.ml.fasl-work.com.nginx`** - a sample nginx site (SPA fallback + long-cache for the `.glb`
  bundles, short-cache for the versioned data JSON). Adapt the `server_name` / `root` for your host.
- **`fasl-slug.service` / `domain.nginx`** - dormant templates (a systemd unit and a reverse proxy) for
  the optional `app/` backend, which Maqueta does not use; kept for reference.

## Why not GitHub Pages

The built site carries every baked bundle: `data/derived` holds about 1.8 GB of GLB layers for the 118
places, above the 1 GB limit GitHub documents for a published Pages site. The template's Pages
workflow therefore never applied here (it failed on every run and Pages was never enabled); it was
removed on 2026-09-18, and `scripts/check_template_residue.py` fails the build if a template sync brings
`deploy-pages.yml` back.

## Deploy flow

1. **Bake** locally: `python data-pipeline/run.py bake --fetched <date>` -> `data/derived/` bundles.
2. **Build** the frontend: `cd frontend && npm run build` (its `copy-data.mjs` pulls `data/derived` into
   `public/data`, then Vite builds `dist/`).
3. **Serve** `frontend/dist/` from your static host, and point your domain at it. Because the baked
   bundles are large, a host with generous disk/bandwidth is preferable to a size-limited static-pages
   service.

The live instance runs at **[maqueta.ml.fasl-work.com](https://maqueta.ml.fasl-work.com)**; its
host-specific operational details are kept in the maintainer's private infrastructure notes, not in this
public repository.
