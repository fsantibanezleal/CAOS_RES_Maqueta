// The App: a real multi-modal fusion workbench. A place selector (grouped by continent) drives the 3D scene
// + full control panel (in Viewer); below, deep tabbed context per place (Scene / Sources / Provenance /
// How to use) with the honest fusion story. Not a card grid, not placeholder text.
import { useEffect, useMemo, useRef, useState } from 'react';
import { SubTabs, useShellLang } from '@fasl-work/caos-app-shell';
import { Viewer } from '../render/Viewer';
import { loadIndex, loadManifest } from '../lib/data';
import type { BundleManifest, PlaceIndex } from '../lib/contract.types';
import { PROVENANCE, rgbCss } from '../lib/labels';

type PlaceEntry = PlaceIndex['places'][number];

// The picker is organized by TOPIC, not continent. The hard rule (asked many times): every terrain-only
// place (tier C - only terrain + satellite, no buildings, incl. Giza/Fuji/Chuquicamata) goes into ONE
// "Terrain & landscapes" category, separate from the built cities.
const MINING = new Set(['calama', 'sierra_gorda']); // built mining towns (Chuquicamata the mine is terrain-only)
const CITY = new Set(['valparaiso', 'concepcion', 'valdivia', 'chiloe_castro', 'antofagasta', 'venice', 'santorini']);
function placeKind(p: PlaceEntry): string {
  const s = p.slug;
  // Metro cores: the large AOIs that span many official sub-areas (boroughs/wards/comunas) for the
  // aggregate-by-admin-area tool. Their own category, listed FIRST. santiago_full is one of them.
  if (s.endsWith('_full')) return 'metrocore';
  if (s === 'santiago_centro' || s.startsWith('stgo_')) return 'santiago';
  if (p.tier === 'C') return 'landscape'; // ALL terrain-only places, their own category
  if (MINING.has(s)) return 'mining';
  if (CITY.has(s)) return 'city';
  return 'metro'; // tier A + the big world cities (incl. Agra, Rio)
}
const KIND_ORDER = ['metrocore', 'santiago', 'metro', 'city', 'mining', 'landscape'];
const KIND_LABEL: Record<string, [string, string]> = {
  metrocore: ['Metro cores (aggregate by sub-area)', 'Nucleos metro (agregar por sub-area)'],
  santiago: ['Santiago (comunas)', 'Santiago (comunas)'],
  metro: ['Major cities', 'Grandes ciudades'],
  city: ['Cities', 'Ciudades'],
  mining: ['Mining', 'Mineria'],
  landscape: ['Terrain & landscapes', 'Terreno y paisajes'],
};


export default function AppPage() {
  const lang: 'en' | 'es' = useShellLang() === 'es' ? 'es' : 'en';
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [slug, setSlug] = useState('');
  const [data, setData] = useState<{ base: string; manifest: BundleManifest } | null>(null);
  const [err, setErr] = useState(''); // fatal: the place INDEX could not be loaded (nothing can render)
  const [manifestErr, setManifestErr] = useState(''); // one place failed to load; keep the picker so you can pick another

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
    setManifestErr('');
    loadManifest(slug).then(setData).catch((e) => setManifestErr(String(e)));
  }, [slug]);

  const current = index?.places.find((p) => p.slug === slug);

  if (err)
    return (
      <div className="mq-page">
        <p className="mq-error">{t('Could not load baked places.', 'No se pudieron cargar los lugares precalculados.')} <code>{err}</code></p>
      </div>
    );

  return (
    <div className="mq-page mq-app">
      <div className="mq-app-head">
        <div className="mq-select-place">
          {t('Place', 'Lugar')}
          {index && <PlacePicker places={index.places} slug={slug} onSelect={setSlug} lang={lang} />}
        </div>
        {current && index && (
          <span className="mq-app-meta">
            {index.n_places}/{index.places.length ? index.tiers.A.length + index.tiers.B.length + index.tiers.C.length : 40} {t('places baked', 'lugares precalculados')} · {current.category} · {current.n_layers} {t('layers', 'capas')} · {(current.total_bytes / 1e6).toFixed(1)} MB
          </span>
        )}
      </div>

      {data ? (
        <>
          <Viewer baseUrl={data.base} manifest={data.manifest} lang={lang} />
          <PlaceContext manifest={data.manifest} lang={lang} />
        </>
      ) : manifestErr ? (
        <div className="mq-canvas mq-canvas-empty">
          <p className="mq-error">
            {t('Could not load this place.', 'No se pudo cargar este lugar.')} <code>{manifestErr}</code>
          </p>
          <p className="mq-sub">{t('Pick another place from the selector above.', 'Elige otro lugar en el selector de arriba.')}</p>
        </div>
      ) : (
        <div className="mq-canvas mq-canvas-empty">{t('Loading...', 'Cargando...')}</div>
      )}
    </div>
  );
}

// A searchable place picker that scales to 100+ places: type to filter by city / country / landmark name,
// results grouped by continent then country. Replaces the native <select>, which is unusable at this size.
function PlacePicker({ places, slug, onSelect, lang }: { places: PlaceEntry[]; slug: string; onSelect: (s: string) => void; lang: 'en' | 'es' }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [openCat, setOpenCat] = useState<string | null>(null); // which topic category is expanded (accordion)
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = places.find((p) => p.slug === slug);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); clearTimeout(id); };
  }, [open]);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(
    () => places.filter((p) => !ql || `${p.name} ${p.city} ${p.country} ${p.continent}`.toLowerCase().includes(ql)),
    [places, ql],
  );
  // Places are grouped by TOPIC (Santiago comunas, Major cities, Cities, Mining, Landmarks, Landscapes),
  // sorted alphabetically inside each by the label the user actually reads (city, or the place name for
  // the landscape group), in the selected language's collation - so the list scans A->Z as displayed.
  const label = (k: string, p: PlaceEntry) => (k === 'landscape' ? p.name : p.city);
  const grouped = useMemo(() => {
    const o: Record<string, PlaceEntry[]> = {};
    filtered.forEach((p) => (o[placeKind(p)] ??= []).push(p));
    Object.entries(o).forEach(([k, ps]) =>
      ps.sort((a, b) => label(k, a).localeCompare(label(k, b), lang) || a.name.localeCompare(b.name, lang)),
    );
    return o;
  }, [filtered, lang]);
  const conts = [
    ...KIND_ORDER.filter((k) => grouped[k]),
    ...Object.keys(grouped).filter((k) => !KIND_ORDER.includes(k)).sort(),
  ];
  const groupLabel = (k: string) => (KIND_LABEL[k] ? t(KIND_LABEL[k][0], KIND_LABEL[k][1]) : k);
  const pick = (s: string) => { onSelect(s); setOpen(false); setQ(''); };

  return (
    <div className="mq-picker" ref={ref}>
      <button className="mq-picker-btn" onClick={() => setOpen((o) => !o)} title={t('Change place', 'Cambiar lugar')}>
        <span className="mq-picker-cur">{current ? `${current.country} · ${current.city}` : t('Select a place', 'Seleccionar un lugar')}</span>
        <span className="mq-picker-chev">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mq-picker-pop">
          <input
            ref={inputRef}
            className="mq-picker-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && filtered[0]) pick(filtered[0].slug); }}
            placeholder={t(`Search ${places.length} places (city, country, landmark)`, `Buscar ${places.length} lugares (ciudad, pais, hito)`)}
          />
          <div className="mq-picker-list">
            {conts.length === 0 && <p className="mq-picker-empty">{t('No match', 'Sin coincidencias')}</p>}
            {conts.map((cont) => {
              // A search expands everything; otherwise categories are collapsed to just their header + count,
              // and clicking one expands its places (accordion) - so it's a compact menu, not a 107-item list.
              const expanded = !!ql || openCat === cont;
              const byName = cont === 'landscape';
              return (
                <div key={cont} className="mq-picker-group">
                  <button
                    className={`mq-picker-cat ${expanded ? 'on' : ''}`}
                    onClick={() => setOpenCat((c) => (c === cont ? null : cont))}
                  >
                    <span className="mq-picker-catchev">{expanded ? '▾' : '▸'}</span>
                    <span className="mq-picker-catname">{groupLabel(cont)}</span>
                    <span className="mq-picker-catcount">{grouped[cont].length}</span>
                  </button>
                  {expanded &&
                    grouped[cont].map((p) => (
                      <button key={p.slug} className={`mq-picker-item ${p.slug === slug ? 'on' : ''}`} onClick={() => pick(p.slug)}>
                        <b>{byName ? p.name : p.city}</b>
                        <span className="mq-muted">{p.country}{p.name !== p.city && !byName ? ` · ${p.name}` : ''}</span>
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
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
        <li>{t('Drag to orbit, scroll to zoom; use the Aerial / Oblique / Street camera presets.', 'Arrastrar para orbitar, rueda para acercar; usa los presets Cenital / Oblicua / Calle.')}</li>
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
