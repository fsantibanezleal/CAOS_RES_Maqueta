# deploy/

Maqueta is a **static product** (ADR-0057 replay), deployed as `vps-static` on the **ml/heavy box**
(`hetzner-ml-fasl-work`, 89.167.4.175) at **maqueta.ml.fasl-work.com**. The large baked bundles want that
box's disk headroom, and the `*.ml.fasl-work.com` wildcard already resolves (no DNS change).

## Files

- **`maqueta.ml.fasl-work.com.nginx`** - the static nginx site (SPA fallback + bundle caching). Install +
  cert instructions are in the file header.
- **`pages.md` / `fasl-*.service` / `domain.nginx`** - DORMANT template variants. Maqueta does not use GitHub
  Pages (private repo) nor the `app/` backend, so these stay as a reference.

## Deploy flow (static, ml box)

1. **Bake** locally: `python -m maquetalab.pipeline --fetched <date>` -> `data/derived/` bundles.
2. **Build** the frontend: `cd frontend && npm run build` (its `copy-data.mjs` pulls `data/derived` into
   `public/data`, then vite builds `dist/`).
3. **Sync** to the box: `rsync -a frontend/dist/ root@89.167.4.175:/var/www/maqueta.ml.fasl-work.com/`
   (or clone the repo on the box, build there, and copy `dist/`).
4. **First time only:** install the nginx site + `certbot --nginx -d maqueta.ml.fasl-work.com` (see the
   `.nginx` file header). The prod `deploy-fasl.sh` targets the prod box, so this uses the manual path or a
   host-parameterized variant per the ml-box README in CAOS_MANAGE.

Full binding: `CAOS_MANAGE/deployments/maqueta.md`.
