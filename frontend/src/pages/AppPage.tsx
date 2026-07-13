// The App: a real multi-modal fusion workbench. A place selector (grouped by continent) drives the 3D scene
// + full control panel (in Viewer); below, deep tabbed context per place (Scene / Sources / Provenance /
// How to use) with the honest fusion story. Not a card grid, not placeholder text.
import { useEffect, useMemo, useState } from 'react';
import { SubTabs, useShellLang } from '@fasl-work/caos-app-shell';
import { Viewer } from '../render/Viewer';
import { loadIndex, loadManifest } from '../lib/data';
import type { BundleManifest, PlaceIndex } from '../lib/contract.types';
import { PROVENANCE, rgbCss } from '../lib/labels';


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
        // Default to the Providencia comuna if baked, else the full Santiago metro core, else the first place.
        const def =
          ix.places.find((p) => p.slug === 'stgo_providencia') ??
          ix.places.find((p) => p.slug === 'santiago_full') ??
          ix.places[0];
        setSlug(def?.slug ?? '');
      })
      .catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => {
    if (!slug) return;
    setData(null);
    loadManifest(slug).then(setData).catch((e) => setErr(String(e)));
  }, [slug]);

  // Group places by continent (hierarchy), country then city inside; the option label carries
  // country + city so the full continent > country > city hierarchy reads in a native select.
  const CONTINENT_ORDER = ['South America', 'North America', 'Europe', 'Africa', 'Asia', 'Oceania'];
  const byContinent = useMemo(() => {
    const o: Record<string, PlaceIndex['places']> = {};
    index?.places.forEach((p) => (o[p.continent || 'Other'] ??= []).push(p));
    Object.values(o).forEach((ps) =>
      ps.sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city)),
    );
    return o;
  }, [index]);
  const current = index?.places.find((p) => p.slug === slug);

  if (err)
    return (
      <div className="mq-page">
        <p className="mq-error">{t('Could not load baked places.', 'No se pudieron cargar los lugares horneados.')} <code>{err}</code></p>
      </div>
    );

  return (
    <div className="mq-page mq-app">
      <div className="mq-app-head">
        <label className="mq-select-place">
          {t('Place', 'Lugar')}
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {CONTINENT_ORDER.filter((c) => byContinent[c]).map((cont) => (
              <optgroup key={cont} label={cont}>
                {byContinent[cont].map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.country} · {p.city}
                    {p.city !== p.name ? ` (${p.name})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {current && index && (
          <span className="mq-app-meta">
            {index.n_places}/{index.places.length ? index.tiers.A.length + index.tiers.B.length + index.tiers.C.length : 40} {t('places baked', 'lugares horneados')} · {current.category} · {current.n_layers} {t('layers', 'capas')} · {(current.total_bytes / 1e6).toFixed(1)} MB
          </span>
        )}
      </div>

      {data ? (
        <>
          <Viewer baseUrl={data.base} manifest={data.manifest} lang={lang} />
          <PlaceContext manifest={data.manifest} lang={lang} />
        </>
      ) : (
        <div className="mq-canvas mq-canvas-empty">{t('Loading...', 'Cargando...')}</div>
      )}
    </div>
  );
}

function PlaceContext({ manifest, lang }: { manifest: BundleManifest; lang: 'en' | 'es' }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  // The buildings_lite layer is an internal LoD proxy, not a user-facing modality.
  const userLayers = manifest.layers.filter((l) => l.name !== 'buildings_lite');
  const mix = manifest.stats.height_mix;
  const totalB = (mix.measured + mix.floors + mix.raster + mix.prior) || 1;
  const a = manifest.aoi;
  const SRC = ['measured', 'floors', 'raster', 'prior'] as const;

  const scene = (
    <div className="mq-ctx-body">
      <p>
        {t(
          `A real reconstruction of ${a.name}, ${a.size_m[0].toFixed(0)} x ${a.size_m[1].toFixed(0)} m (origin ${a.origin_wgs84[1].toFixed(4)}, ${a.origin_wgs84[0].toFixed(4)}), fused offline from open public geodata. Every layer records its source, license and fetch date; every building records where its height came from. Use the panel to toggle each source layer, recolour buildings by height / provenance / land use, filter by height or provenance, and click a building to select it.`,
          `Una reconstrucción real de ${a.name}, ${a.size_m[0].toFixed(0)} x ${a.size_m[1].toFixed(0)} m (origen ${a.origin_wgs84[1].toFixed(4)}, ${a.origin_wgs84[0].toFixed(4)}), fusionada offline a partir de geodatos públicos abiertos. Cada capa registra su fuente, licencia y fecha; cada edificio registra de dónde viene su altura. Usa el panel para activar cada capa fuente, recolorear edificios por altura / procedencia / uso de suelo, filtrar por altura o procedencia, y hacer clic en un edificio para seleccionarlo.`,
        )}
      </p>
      <div className="mq-ctx-stats">
        {userLayers.map((l) => {
          // Buildings report a feature count; other layers report triangles/points (features is 0, which
          // is NOT nullish, so `??` would wrongly show 0). Pick the first positive count.
          const n = (l.stats.features && l.stats.features > 0 ? l.stats.features : null)
            ?? l.stats.triangles ?? l.stats.points ?? 0;
          return (
            <div key={l.name} className="mq-stat">
              <b>{n.toLocaleString()}</b>
              <span>{l.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
  const sources = (
    <div className="mq-ctx-body">
      <table className="mq-table">
        <thead><tr><th>{t('Layer', 'Capa')}</th><th>{t('Source', 'Fuente')}</th><th>{t('License', 'Licencia')}</th><th>{t('Method', 'Método')}</th></tr></thead>
        <tbody>
          {userLayers.map((l) => (
            <tr key={l.name}>
              <td><b>{l.name}</b></td>
              <td>{l.provenance.source}</td>
              <td><a href={l.provenance.license_url} target="_blank" rel="noreferrer">{l.provenance.license}</a>{l.provenance.commercial_ok === false && <span className="mq-warn"> (NC)</span>}</td>
              <td className="mq-muted">{l.provenance.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {manifest.modalities && manifest.modalities.length > 0 && (
        <>
          <p className="mq-sub" style={{ marginTop: '0.8rem' }}>
            {t('Fused topic modalities (sampled per building):', 'Modalidades temáticas fusionadas (muestreadas por edificio):')}
          </p>
          <table className="mq-table">
            <thead><tr><th>{t('Modality', 'Modalidad')}</th><th>{t('Source', 'Fuente')}</th><th>{t('License', 'Licencia')}</th></tr></thead>
            <tbody>
              {manifest.modalities.map((m) => (
                <tr key={m.key}>
                  <td><b>{m.label}</b> <span className="mq-muted">({m.unit})</span></td>
                  <td>{m.source}</td>
                  <td>{m.license_url ? <a href={m.license_url} target="_blank" rel="noreferrer">{m.license}</a> : m.license}{m.commercial_ok === false && <span className="mq-warn"> (NC)</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {manifest.any_noncommercial && <p className="mq-warn">{t('This scene includes a non-commercial-licensed layer.', 'Esta escena incluye una capa con licencia no comercial.')}</p>}
    </div>
  );
  const provenance = (
    <div className="mq-ctx-body">
      <p>{t('Each building height comes from the best available source (the ladder: measured, then floor count, then a height raster, then a default prior). This scene:', 'Cada altura de edificio viene de la mejor fuente disponible (la escalera: medida, luego num. de pisos, luego un raster de altura, luego un valor por defecto). Esta escena:')}</p>
      <div className="mq-mixbar">
        {SRC.map((s) => {
          const frac = (mix[s] ?? 0) / totalB;
          return frac > 0 ? <span key={s} style={{ width: `${frac * 100}%`, background: rgbCss(PROVENANCE[s].rgb) }} title={`${s}: ${(frac * 100).toFixed(0)}%`} /> : null;
        })}
      </div>
      <div className="mq-legend-list">
        {SRC.map((s) => (
          <span key={s}><i style={{ background: rgbCss(PROVENANCE[s].rgb) }} />{PROVENANCE[s][lang]}: <b>{((mix[s] ?? 0) / totalB * 100).toFixed(0)}%</b> <span className="mq-muted">({mix[s] ?? 0})</span></span>
        ))}
      </div>
      <p className="mq-muted">{t('Colour buildings by "Provenance" in the panel to see this in 3D: green = measured, blue = from floor count, amber = height raster, grey = default. Measured and inferred are never conflated.', 'Colorea los edificios por "Procedencia" en el panel para verlo en 3D: verde = medido, azul = por pisos, ámbar = raster, gris = por defecto. Lo medido y lo inferido nunca se confunden.')}</p>
    </div>
  );
  const howto = (
    <div className="mq-ctx-body">
      <ul className="mq-howto">
        <li>{t('Drag to orbit, scroll to zoom; use the Aerial / Oblique / Street camera presets.', 'Arrastra para orbitar, rueda para acercar; usa los presets Cenital / Oblicua / Calle.')}</li>
        <li>{t('Toggle each fused source layer (terrain, buildings, roads, water, green, rail, population).', 'Activa cada capa fuente (relieve, edificios, calles, agua, verde, vías, población).')}</li>
        <li>{t('Recolour buildings by Height, Provenance or Land use; the legend updates.', 'Recolorea edificios por Altura, Procedencia o Uso de suelo; la leyenda se actualiza.')}</li>
        <li>{t('Filter buildings by a height range, or by which sources their height came from.', 'Filtra edificios por rango de altura, o por la fuente de su altura.')}</li>
        <li>{t('Click a building: it highlights in cyan and the detail panel shows its height, provenance and land use.', 'Haz clic en un edificio: se resalta en cian y el panel muestra su altura, procedencia y uso de suelo.')}</li>
        <li>{t('Raise Neon / glow and enable the pulse for the animated identity.', 'Sube Neón / brillo y activa el pulso para la identidad animada.')}</li>
      </ul>
    </div>
  );

  return (
    <div className="mq-context">
      <SubTabs
        ariaLabel={t('place context', 'contexto del lugar')}
        tabs={[
          { id: 'scene', label: t('Scene', 'Escena'), content: scene },
          { id: 'sources', label: t('Sources', 'Fuentes'), content: sources },
          { id: 'provenance', label: t('Height provenance', 'Procedencia'), content: provenance },
          { id: 'howto', label: t('How to use', 'Cómo usar'), content: howto },
        ]}
      />
    </div>
  );
}
