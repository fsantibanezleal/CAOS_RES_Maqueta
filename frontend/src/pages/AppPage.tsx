// The App: the real workbench. A place selector (grouped by tier) drives the 3D viewer; a Context
// panel gives the deep bilingual write-up (problem -> components -> formalization -> scope -> how to
// use). Mirrors the ADR-0016 "each case is a workbench" structure, adapted to places.
import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import { Viewer } from '../render/Viewer';
import { loadIndex, loadManifest } from '../lib/data';
import type { BundleManifest, PlaceIndex } from '../lib/contract.types';

const TIER_LABEL: Record<string, { en: string; es: string }> = {
  A: { en: 'Ground truth', es: 'Verdad de terreno' },
  B: { en: 'Global-fusion cities', es: 'Ciudades por fusión global' },
  C: { en: 'Terrain-first areas', es: 'Áreas de relieve' },
};

export default function AppPage() {
  const lang: 'en' | 'es' = useShellLang() === 'es' ? 'es' : 'en';
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [slug, setSlug] = useState('');
  const [data, setData] = useState<{ base: string; manifest: BundleManifest } | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    loadIndex()
      .then((ix) => {
        setIndex(ix);
        setSlug(ix.places[0]?.slug ?? '');
      })
      .catch((e) => setErr(String(e)));
  }, []);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    loadManifest(slug).then(setData).catch((e) => setErr(String(e)));
  }, [slug]);

  if (err)
    return (
      <div className="mq-page">
        <p className="mq-error">
          {t('Could not load baked places. Run the pipeline (python -m maquetalab.pipeline).', 'No se pudieron cargar los lugares. Ejecuta el pipeline.')}
          <br />
          <code>{err}</code>
        </p>
      </div>
    );

  const byTier: Record<string, PlaceIndex['places']> = {};
  index?.places.forEach((p) => (byTier[p.tier] ??= []).push(p));
  const current = index?.places.find((p) => p.slug === slug);

  return (
    <div className="mq-page mq-app">
      <div className="mq-app-head">
        <label className="mq-select">
          {t('Place', 'Lugar')}:{' '}
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {Object.entries(byTier).map(([tier, ps]) => (
              <optgroup key={tier} label={`${tier} - ${TIER_LABEL[tier]?.[lang] ?? tier}`}>
                {ps.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} ({p.country})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {current && (
          <span className="mq-app-meta">
            {current.category} · {current.n_layers} {t('layers', 'capas')} ·{' '}
            {(current.total_bytes / 1e6).toFixed(1)} MB
          </span>
        )}
      </div>

      {data ? (
        <Viewer baseUrl={data.base} manifest={data.manifest} lang={lang} />
      ) : (
        <div className="mq-canvas mq-canvas-empty">{t('Loading...', 'Cargando...')}</div>
      )}

      {data && <ContextPanel manifest={data.manifest} lang={lang} />}
    </div>
  );
}

function ContextPanel({ manifest, lang }: { manifest: BundleManifest; lang: 'en' | 'es' }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  const mix = manifest.stats.height_mix;
  const totalB = mix.measured + mix.floors + mix.raster + mix.prior || 1;
  const pct = (n: number) => `${((100 * n) / totalB).toFixed(0)}%`;
  return (
    <div className="mq-context">
      <h3>{t('About this scene', 'Sobre esta escena')}</h3>
      <p>
        {t(
          `This is a real reconstruction of ${manifest.aoi.name}, ${manifest.aoi.size_m[0].toFixed(0)} x ${manifest.aoi.size_m[1].toFixed(0)} m, fused offline from open public geodata. Nothing here is invented: every layer records its source and license.`,
          `Esta es una reconstrucción real de ${manifest.aoi.name}, ${manifest.aoi.size_m[0].toFixed(0)} x ${manifest.aoi.size_m[1].toFixed(0)} m, fusionada offline a partir de geodatos públicos abiertos. Nada aquí es inventado: cada capa registra su fuente y licencia.`,
        )}
      </p>
      <h4>{t('Height provenance', 'Procedencia de alturas')}</h4>
      <p>
        {t(
          'Each building height comes from the best available source. This scene:',
          'Cada altura de edificio viene de la mejor fuente disponible. Esta escena:',
        )}{' '}
        <b>{pct(mix.measured)}</b> {t('measured', 'medida')}, <b>{pct(mix.floors)}</b>{' '}
        {t('from floor counts', 'por num. de pisos')}, <b>{pct(mix.raster)}</b>{' '}
        {t('from a height raster', 'por raster de altura')}, <b>{pct(mix.prior)}</b>{' '}
        {t('default prior', 'valor por defecto')}.
      </p>
      <h4>{t('Data sources', 'Fuentes de datos')}</h4>
      <ul className="mq-credits">
        {manifest.credits.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {manifest.any_noncommercial && (
        <p className="mq-warn">
          {t(
            'This scene includes a non-commercial-licensed layer.',
            'Esta escena incluye una capa con licencia no comercial.',
          )}
        </p>
      )}
      <h4>{t('How to use', 'Cómo usar')}</h4>
      <p>
        {t(
          'Drag to orbit, scroll to zoom. Toggle layers, switch camera presets, and click any building to read its height and provenance. Enable the scan pulse for the animated identity (off by default).',
          'Arrastra para orbitar, rueda para acercar. Activa/desactiva capas, cambia la cámara y haz clic en un edificio para ver su altura y procedencia. Activa el pulso de escaneo para la identidad animada (apagado por defecto).',
        )}
      </p>
    </div>
  );
}
