// The App workbench: the 3D scene + a full attribute-driven control panel. Every fused source is a
// toggleable layer (with provenance shown); buildings can be coloured by ANY attribute (height,
// provenance, function, floors, area, land cover, and future fused modalities) with a live legend;
// numeric attributes get range filters and categorical ones get value filters, all operating over the
// building features and combined with AND; clicking a building highlights it in 3D and opens a detail
// panel. Scene dynamics: camera presets, neon intensity, pulse. Edges give each extrusion 3D shape.
import { useEffect, useMemo, useRef, useState } from 'react';
import { readTheme } from '@fasl-work/caos-app-shell';
import { MaquetaScene, type AttrSpec, type AreaPoint, type PickInfo } from './MaquetaScene';
import type { AreaStats, BundleManifest, BundleLayer } from '../lib/contract.types';
import { PROVENANCE, WORLDCOVER_LABELS, WORLDCOVER_RGB, rgbCss } from '../lib/labels';

type Lang = 'en' | 'es';
const LAYER_SWATCH: Record<string, string> = {
  terrain: '#464a52', buildings: '#c8a05a', roads: '#78c8ff', rail: '#ffa05a',
  water: '#005faf', green: '#2e783c', population: '#d64828', lod2: '#ffa94d',
};

export function Viewer({ baseUrl, manifest, lang }: { baseUrl: string; manifest: BundleManifest; lang: Lang }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MaquetaScene | null>(null);
  const [pick, setPick] = useState<PickInfo | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [attrs, setAttrs] = useState<AttrSpec[]>([]);
  const [colorMode, setColorMode] = useState('height');
  const [numFilters, setNumFilters] = useState<Record<string, [number, number]>>({});
  const [catFilters, setCatFilters] = useState<Record<string, Set<string>>>({});
  const [neon, setNeon] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [edges, setEdgesState] = useState(true);
  const [edgesLarge, setEdgesLarge] = useState(false);
  const [imagery, setImagery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false); // controls collapsed by default; the map leads, open via the toggle
  const areaPtsRef = useRef<AreaPoint[]>([]);
  const [areaMode, setAreaMode] = useState(false);
  const [areaCount, setAreaCount] = useState(0);
  const [areaStats, setAreaStats] = useState<AreaStats | null>(null);
  const [areaScope, setAreaScope] = useState<'polygon' | 'place'>('polygon');
  const [adminUnits, setAdminUnits] = useState<{ name: string; count: number }[]>([]);
  const [adminAttr, setAdminAttr] = useState<string | null>(null);
  const [adminTable, setAdminTable] = useState<{ name: string; value: number; count: number }[]>([]);
  const [adminUnitAttrs, setAdminUnitAttrs] = useState<{ key: string; label: string; unit: string; group: 'environment' | 'indicator' }[]>([]);
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  useEffect(() => {
    if (!mountRef.current) return;
    const s = new MaquetaScene(mountRef.current, readTheme() === 'dark');
    s.setOnPick(setPick);
    // Area tool: each ground click drops a polygon vertex and re-draws the open outline.
    s.setOnGroundClick((p) => {
      if (!p) return;
      areaPtsRef.current = [...areaPtsRef.current, p];
      s.showAreaPolygon(areaPtsRef.current, false);
      setAreaCount(areaPtsRef.current.length);
    });
    sceneRef.current = s;
    const obs = new MutationObserver(() => s.setTheme(readTheme() === 'dark'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { obs.disconnect(); s.dispose(); };
  }, []);

  // Sync the control panel from whatever buildings layer is currently active (the lite LoD proxy first,
  // then the full layer after it swaps in). Attribute ranges/categories are read from the live scene.
  const syncFromScene = (s: MaquetaScene, keepColorMode = false) => {
    const a = s.attributes();
    setAttrs(a);
    const nf: Record<string, [number, number]> = {};
    const cf: Record<string, Set<string>> = {};
    a.forEach((sp) => {
      if (sp.kind === 'numeric') nf[sp.key] = s.numericRange(sp.key);
      else cf[sp.key] = new Set(s.categories(sp.key));
    });
    setNumFilters(nf);
    setCatFilters(cf);
    if (!keepColorMode) {
      // Default to colouring by building function when the place actually has function data; otherwise
      // fall back to height (terrain-first places and sparsely-tagged fabric have no useful function split).
      const def = a.some((sp) => sp.key === 'use') && s.categories('use').length > 0 ? 'use' : 'height';
      setColorMode(def);
      s.setColorMode(def);
    }
    const ei = s.edgesInfo();
    setEdgesState(ei.on);
    setEdgesLarge(ei.large);
  };

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    setLoading(true);
    setBuildingsLoading(false);
    setPick(null);
    // A new place reloads the scene: reset the area tool.
    areaPtsRef.current = [];
    setAreaCount(0);
    setAreaStats(null);
    setAreaMode(false);
    s.setDrawMode(false);
    setAdminUnits([]);
    setAdminAttr(null);
    setAdminTable([]);
    // Layer visibility is known from the manifest up front (population off by default; the internal
    // buildings_lite proxy is not a user layer).
    const v: Record<string, boolean> = {};
    // population + the lod2 ground-truth overlay default OFF (toggle on to compare fusion vs authoritative).
    manifest.layers.forEach((l) => (v[l.name] = l.name !== 'population' && l.name !== 'lod2'));
    setVisible(v);
    const hasLite = manifest.layers.some((l) => l.name === 'buildings_lite');
    s.loadBundle(
      baseUrl,
      manifest,
      () => {
        // Base (terrain + roads) is on screen: hide the overlay immediately (fastest first paint) and keep
        // a light "loading" hint while the buildings arrive.
        manifest.layers.forEach((l) => l.name !== 'buildings_lite' && s.setLayerVisible(l.name, v[l.name]));
        setLoading(false);
        setBuildingsLoading(true);
      },
      () => {
        // The buildings proxy (lite where present) is in: populate the control panel so the scene is fully
        // interactive; keep the hint only if a lite proxy stood in and the full layer is still streaming.
        syncFromScene(s);
        setBuildingsLoading(hasLite);
      },
    ).then(() => {
      // Full buildings are in (if a lite proxy was used, it has been swapped out): re-sync ranges, keep the
      // user's current colour mode.
      manifest.layers.forEach((l) => l.name !== 'buildings_lite' && s.setLayerVisible(l.name, v[l.name]));
      syncFromScene(s, true);
      setLoading(false);
      setBuildingsLoading(false);
      // Admin sub-areas (comunas/districts): load + assign buildings so they can be aggregated by unit.
      s.loadAdmin(baseUrl)
        .then((u) => {
          setAdminUnits(u);
          setAdminUnitAttrs(s.adminUnitAttributes());
        })
        .catch(() => {
          setAdminUnits([]);
          setAdminUnitAttrs([]);
        });
    });
  }, [baseUrl, manifest]);

  const setLayer = (name: string, on: boolean) => {
    setVisible((p) => ({ ...p, [name]: on }));
    sceneRef.current?.setLayerVisible(name, on);
  };
  const changeColor = (k: string) => { setColorMode(k); sceneRef.current?.setColorMode(k); if (adminAttr) { setAdminAttr(null); setAdminTable([]); sceneRef.current?.setAdminChoropleth(null); } };
  const changeNum = (key: string, lo: number, hi: number) => {
    setNumFilters((p) => ({ ...p, [key]: [lo, hi] }));
    sceneRef.current?.setNumericFilter(key, lo, hi);
  };
  const toggleCat = (key: string, val: string) => {
    setCatFilters((p) => {
      const next = new Set(p[key]);
      next.has(val) ? next.delete(val) : next.add(val);
      sceneRef.current?.setCategoricalFilter(key, next);
      return { ...p, [key]: next };
    });
  };

  const startArea = () => {
    const s = sceneRef.current;
    if (!s) return;
    areaPtsRef.current = [];
    setAreaCount(0);
    setAreaStats(null);
    setAreaScope('polygon');
    s.clearArea();
    s.setDrawMode(true);
    setAreaMode(true);
  };
  const finishArea = () => {
    const s = sceneRef.current;
    if (!s) return;
    const pts = areaPtsRef.current;
    if (pts.length >= 3) {
      s.showAreaPolygon(pts, true);
      setAreaStats(s.computeAreaStats(pts, lang));
      setAreaScope('polygon');
    }
    s.setDrawMode(false);
    setAreaMode(false);
  };
  const clearArea = () => {
    const s = sceneRef.current;
    s?.clearArea();
    s?.setDrawMode(false);
    areaPtsRef.current = [];
    setAreaCount(0);
    setAreaStats(null);
    setAreaMode(false);
  };
  const wholePlaceStats = () => {
    const s = sceneRef.current;
    if (!s) return;
    s.clearArea();
    s.setDrawMode(false);
    areaPtsRef.current = [];
    setAreaCount(0);
    setAreaMode(false);
    setAreaScope('place');
    setAreaStats(s.computeAreaStats(null, lang));
  };

  const chooseAdmin = (key: string | null) => {
    const s = sceneRef.current;
    if (!s) return;
    setAdminAttr(key);
    s.setAdminChoropleth(key);
    if (!key) {
      setAdminTable([]);
      return;
    }
    // Unit-level layers (solar/climate env, DO indicators) are keyed to the unit itself, so a unit with no
    // buildings can still carry a value; building-derived means need at least one building.
    const unitLevel = key.startsWith('env:') || key.startsWith('ind:');
    setAdminTable(
      s
        .adminStats(key)
        .filter((u) => (unitLevel ? Number.isFinite(u.value) : u.count > 0))
        .sort((a, b) => b.value - a.value),
    );
  };
  const adminAttrMeta = (key: string | null): { label: string; unit: string } => {
    if (!key) return { label: '', unit: '' };
    const ul = adminUnitAttrs.find((a) => a.key === key);
    if (ul) return { label: ul.label, unit: ul.unit };
    const na = attrs.find((a) => a.key === key);
    return { label: (na?.[lang] as string) ?? key, unit: na?.unit ?? '' };
  };

  const colorAttrs = useMemo(() => attrs, [attrs]);
  const numericAttrs = attrs.filter((a) => a.kind === 'numeric');
  const categoricalAttrs = attrs.filter((a) => a.kind === 'categorical');

  return (
    <div className="mq-workbench">
      <div className="mq-canvas" ref={mountRef}>
        {loading && <div className="mq-loading">{t('Loading fused scene...', 'Cargando escena fusionada...')}</div>}
        {!loading && buildingsLoading && (
          <div className="mq-streaming">{t('Loading full detail...', 'Cargando detalle completo...')}</div>
        )}
        {!loading && <ColorLegend scene={sceneRef.current} attrKey={colorMode} lang={lang} />}
      </div>
      {areaStats ? (
        <AreaStatsPanel stats={areaStats} scope={areaScope} onClose={clearArea} lang={lang} />
      ) : (
        <SelectionPanel pick={pick} lang={lang} scene={sceneRef.current} colorMode={colorMode} adminAttr={adminAttr} />
      )}
      <button className="mq-panel-toggle" onClick={() => setPanelOpen((o) => !o)} title={t('Toggle controls', 'Alternar controles')}>
        {panelOpen ? '✕' : '☰'}
        <span>{panelOpen ? t('Hide', 'Ocultar') : t('Controls', 'Controles')}</span>
      </button>
      {panelOpen && (
      <aside className="mq-panel">
        <div className="mq-panel-h">{t('Controls', 'Controles')}</div>
        <Section title={t('Layers (the fused modalities)', 'Capas (las modalidades fusionadas)')}>
          {manifest.layers.filter((l) => l.name !== 'buildings_lite').map((l) => (
            <LayerRow key={l.name} layer={l} on={visible[l.name] ?? true} swatch={LAYER_SWATCH[l.name] ?? '#888'}
              onToggle={(v) => setLayer(l.name, v)} lang={lang} />
          ))}
        </Section>

        {manifest.environment?.values && Object.keys(manifest.environment.values).length > 0 && (
          <Section title={t('Environment (solar / climate)', 'Ambiente (solar / clima)')} defaultOpen={false}>
            <p className="mq-sub">
              {t(
                'Solar-energy potential and climate normals sampled at this place. These are near-constant across the area; aggregate them by sub-area below to compare comunas.',
                'Potencial de energía solar y normales climáticas muestreadas en este lugar. Son casi constantes en el área; agregarlas por subárea más abajo permite comparar comunas.',
              )}
            </p>
            <div className="mq-envgrid">
              {Object.entries(manifest.environment.values).map(([k, v]) => {
                const m = manifest.environment!.meta[k];
                const val = Math.abs(v) >= 1000 ? v.toLocaleString() : Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1);
                return (
                  <div className="mq-envrow" key={k}>
                    <span className="mq-envlabel">{m?.label ?? k}</span>
                    <span className="mq-envval">
                      <b>{val}</b> <i>{m?.unit ?? ''}</i>
                    </span>
                  </div>
                );
              })}
            </div>
            {manifest.environment.sources?.length > 0 && (
              <p className="mq-sub mq-muted">
                {t('Sources', 'Fuentes')}: {manifest.environment.sources.map((s) => s.source).join(' · ')}
              </p>
            )}
          </Section>
        )}

        <Section title={t('Colour buildings by', 'Colorear edificios por')}>
          <div className="mq-seg mq-seg-wrap">
            {colorAttrs.map((a) => (
              <button key={a.key} className={colorMode === a.key ? 'on' : ''} onClick={() => changeColor(a.key)}>
                {a[lang]}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('Filter buildings', 'Filtrar edificios')} defaultOpen={false}>
          {numericAttrs.map((a) => {
            const [rlo, rhi] = sceneRef.current?.numericRange(a.key) ?? [0, 1];
            const [lo, hi] = numFilters[a.key] ?? [rlo, rhi];
            return (
              <div className="mq-filter" key={a.key}>
                <label>{a[lang]}: {lo.toFixed(0)}-{hi.toFixed(0)} {a.unit ?? ''}</label>
                <div className="mq-dual">
                  <input type="range" min={rlo} max={rhi} value={lo} onChange={(e) => changeNum(a.key, Math.min(+e.target.value, hi), hi)} />
                  <input type="range" min={rlo} max={rhi} value={hi} onChange={(e) => changeNum(a.key, lo, Math.max(+e.target.value, lo))} />
                </div>
              </div>
            );
          })}
          {categoricalAttrs.map((a) => {
            const vals = sceneRef.current?.categories(a.key) ?? [];
            if (!vals.length) return null;
            return (
              <div className="mq-catfilter" key={a.key}>
                <span className="mq-sub">{a[lang]}</span>
                <div className="mq-chips">
                  {vals.slice(0, 14).map((v) => (
                    <label key={v} className="mq-chip mq-chip-sm">
                      <input type="checkbox" checked={catFilters[a.key]?.has(v) ?? true} onChange={() => toggleCat(a.key, v)} />
                      <i style={{ background: catSwatch(a.key, v, vals) }} />
                      {catLabel(a.key, v, lang)}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>

        <Section title={t('Area statistics', 'Estadísticas de área')} defaultOpen={false}>
          <p className="mq-sub">
            {t(
              'Summarize the fused building attributes over any sub-area: draw a polygon (a barrio, a block, a corridor) or take the whole place.',
              'Resumir los atributos fusionados de los edificios en cualquier subárea: dibujar un polígono (un barrio, una manzana, un corredor) o tomar todo el lugar.',
            )}
          </p>
          <div className="mq-seg">
            {!areaMode ? (
              <button onClick={startArea}>{t('Draw area', 'Dibujar área')}</button>
            ) : (
              <button className="on" onClick={finishArea} disabled={areaCount < 3}>
                {t('Finish', 'Terminar')} ({areaCount})
              </button>
            )}
            <button onClick={wholePlaceStats}>{t('Whole place', 'Todo el lugar')}</button>
            <button onClick={clearArea}>{t('Clear', 'Limpiar')}</button>
          </div>
          {areaMode && (
            <p className="mq-sub mq-warn">
              {t(
                'Click on the map to drop points around the area, then Finish (min 3 points). Zoom with the wheel.',
                'Hacer clic en el mapa para marcar puntos alrededor del área, luego Terminar (mín. 3 puntos). Zoom con la rueda.',
              )}
            </p>
          )}
        </Section>

        {adminUnits.length > 0 && (
          <Section title={t('Aggregate by admin area', 'Agregar por área administrativa')} defaultOpen={false}>
            <p className="mq-sub">
              {t(
                `${adminUnits.length} sub-areas (comunas / districts). Choose a layer to colour every unit and read the ranked table: building averages, geophysical environment (solar / climate), or socio-economic indicators.`,
                `${adminUnits.length} subáreas (comunas / distritos). Seleccionar una capa para colorear cada unidad y leer la tabla ordenada: promedios de edificios, ambiente geofísico (solar / clima), o indicadores socioeconómicos.`,
              )}
            </p>
            <span className="mq-sub mq-agg-group">{t('Building averages', 'Promedios de edificios')}</span>
            <div className="mq-seg mq-seg-wrap">
              {numericAttrs.map((a) => (
                <button key={a.key} className={adminAttr === a.key ? 'on' : ''} onClick={() => chooseAdmin(a.key)}>
                  {a[lang]}
                </button>
              ))}
            </div>
            {adminUnitAttrs.some((a) => a.group === 'environment') && (
              <>
                <span className="mq-sub mq-agg-group">{t('Environment (solar / climate)', 'Ambiente (solar / clima)')}</span>
                <div className="mq-seg mq-seg-wrap">
                  {adminUnitAttrs.filter((a) => a.group === 'environment').map((a) => (
                    <button key={a.key} className={adminAttr === a.key ? 'on' : ''} onClick={() => chooseAdmin(a.key)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {adminUnitAttrs.some((a) => a.group === 'indicator') && (
              <>
                <span className="mq-sub mq-agg-group">{t('Data Observatory (Chile)', 'Observatorio de Datos (Chile)')}</span>
                <div className="mq-seg mq-seg-wrap">
                  {adminUnitAttrs.filter((a) => a.group === 'indicator').map((a) => (
                    <button key={a.key} className={adminAttr === a.key ? 'on' : ''} onClick={() => chooseAdmin(a.key)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {adminAttr && (
              <div className="mq-seg">
                <button onClick={() => chooseAdmin(null)}>{t('Clear', 'Limpiar')}</button>
              </div>
            )}
            {adminTable.length > 0 && (
              <div className="mq-admin-tablewrap">
                <table className="mq-admin-table">
                  <thead>
                    <tr>
                      <th>{t('Area', 'Área')}</th>
                      <th>{adminAttrMeta(adminAttr).label} {adminAttrMeta(adminAttr).unit}</th>
                      <th>n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminTable.map((u) => (
                      <tr key={u.name}>
                        <td>{u.name}</td>
                        <td><b>{Number.isFinite(u.value) ? u.value.toFixed(Math.abs(u.value) < 10 ? 2 : Math.abs(u.value) < 100 ? 1 : 0) : '-'}</b></td>
                        <td className="mq-muted">{u.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}

        <Section title={t('Scene', 'Escena')} defaultOpen={false}>
          <div className="mq-seg">
            <button onClick={() => sceneRef.current?.cameraPreset('aerial')}>{t('Aerial', 'Cenital')}</button>
            <button onClick={() => sceneRef.current?.cameraPreset('oblique')}>{t('Oblique', 'Oblicua')}</button>
            <button onClick={() => sceneRef.current?.cameraPreset('street')}>{t('Street', 'Calle')}</button>
          </div>
          <label className="mq-chip mq-chip-hl">
            <input type="checkbox" checked={imagery} onChange={(e) => { setImagery(e.target.checked); sceneRef.current?.setTerrainImagery(e.target.checked); }} />
            {t('Satellite imagery (Sentinel-2)', 'Imagen satelital (Sentinel-2)')}
          </label>
          <label className="mq-slider">{t('Neon / glow', 'Neón / brillo')}
            <input type="range" min={0} max={2} step={0.05} value={neon} onChange={(e) => { setNeon(+e.target.value); sceneRef.current?.setNeon(+e.target.value); }} />
          </label>
          <label className="mq-chip"><input type="checkbox" checked={animate} onChange={(e) => { setAnimate(e.target.checked); sceneRef.current?.setAnimate(e.target.checked); }} />{t('Pulse animation', 'Animación de pulso')}</label>
          <label className="mq-chip"><input type="checkbox" checked={edges} onChange={(e) => { setEdgesState(e.target.checked); sceneRef.current?.setEdges(e.target.checked); }} />{t('Wireframe (building edges)', 'Malla (bordes de edificios)')}</label>
          {edgesLarge && <p className="mq-sub">{t('Large scene: edges are off by default for a fast load; enable to read building shape (may take a moment).', 'Escena grande: la malla viene apagada para cargar rápido; activarla muestra la forma de los edificios (puede tardar un momento).')}</p>}
        </Section>
      </aside>
      )}
    </div>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`mq-section ${open ? '' : 'mq-section-closed'}`}>
      <h4 className="mq-section-h" role="button" tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}>
        <span className="mq-section-chev">{open ? '▾' : '▸'}</span>{title}
      </h4>
      {open && <div className="mq-section-body">{children}</div>}
    </div>
  );
}

const CAT_PALETTE = [[66,133,244],[219,68,55],[244,180,0],[15,157,88],[171,71,188],[0,172,193],[255,112,67],[158,157,36],[94,53,177],[3,155,229],[124,179,66],[216,27,96],[141,110,99],[84,110,122]] as [number,number,number][];
function catSwatch(key: string, val: string, vals: string[]): string {
  if (key === 'provenance') return rgbCss(PROVENANCE[val]?.rgb ?? [140, 140, 140]);
  if (key === 'landuse') return rgbCss(WORLDCOVER_RGB[Number(val)] ?? [140, 140, 140]);
  return rgbCss(CAT_PALETTE[vals.indexOf(val) % CAT_PALETTE.length]);
}
function catLabel(key: string, val: string, lang: Lang): string {
  if (key === 'provenance') return PROVENANCE[val]?.[lang] ?? val;
  if (key === 'landuse') return WORLDCOVER_LABELS[Number(val)]?.[lang] ?? val;
  return val;
}

function LayerRow({ layer, on, swatch, onToggle, lang }: { layer: BundleLayer; on: boolean; swatch: string; onToggle: (v: boolean) => void; lang: Lang }) {
  const hasFeat = layer.stats.features != null && layer.stats.features > 0;
  const count = (hasFeat ? layer.stats.features : layer.stats.triangles ?? layer.stats.points ?? 0)!.toLocaleString();
  const unit = hasFeat ? (lang === 'es' ? 'edif.' : 'feat.') : (lang === 'es' ? 'tri' : 'tris');
  return (
    <div className={`mq-layer ${on ? '' : 'off'}`}>
      <label>
        <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} />
        <i className="mq-sw" style={{ background: swatch }} />
        <b>{layer.name}</b>
        <span className={`mq-lic ${layer.provenance.commercial_ok === false ? 'nc' : ''}`}>{layer.provenance.license}</span>
      </label>
      <div className="mq-layer-meta">
        <span title={layer.provenance.license_name}>{layer.provenance.source}</span>
        <span className="mq-muted"> · {count} {unit}</span>
      </div>
    </div>
  );
}

function ColorLegend({ scene, attrKey, lang }: { scene: MaquetaScene | null; attrKey: string; lang: Lang }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  if (!scene) return null;
  const spec = scene.attributes().find((a) => a.key === attrKey);
  if (!spec) return null;
  return (
    <div className="mq-legend-box">
      <span className="mq-legend-title">{spec[lang]}{spec.unit ? ` (${spec.unit})` : ''}</span>
      {spec.kind === 'numeric' ? (
        <div className="mq-ramp">
          <span className="mq-ramp-bar" />
          <div className="mq-ramp-lbl"><span>{scene.numericRange(attrKey)[0]}</span><span>{scene.numericRange(attrKey)[1]}</span></div>
        </div>
      ) : (
        <div className="mq-legend-list">
          {scene.categories(attrKey).slice(0, 10).map((v, i) => (
            <span key={v}><i style={{ background: catSwatch(attrKey, v, scene.categories(attrKey)) }} />{catLabel(attrKey, v, lang)}{i === 9 ? ' ...' : ''}</span>
          ))}
        </div>
      )}
      {t('', '')}
    </div>
  );
}

function fmtArea(m2: number): string {
  if (m2 >= 1e6) return `${(m2 / 1e6).toFixed(2)} km2`;
  if (m2 >= 1e4) return `${(m2 / 1e4).toFixed(1)} ha`;
  return `${Math.round(m2).toLocaleString()} m2`;
}
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString();
}
function MixBar({ bins, total }: { bins: { label: string; count: number }[]; total: number }) {
  const top = bins.slice(0, 6);
  return (
    <div className="mq-as-mix">
      <div className="mq-as-mixbar">
        {top.map((b, i) => (
          <span key={b.label} style={{ width: `${(100 * b.count) / Math.max(1, total)}%`, background: MIX_COLORS[i % MIX_COLORS.length] }} title={`${b.label}: ${b.count}`} />
        ))}
      </div>
      <div className="mq-as-mixlbl">
        {top.map((b, i) => (
          <span key={b.label}><i style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />{b.label} {Math.round((100 * b.count) / Math.max(1, total))}%</span>
        ))}
      </div>
    </div>
  );
}
const MIX_COLORS = ['#2a6cff', '#1f9d64', '#d68215', '#d63d68', '#7b4cff', '#00acc1', '#9aa2ad'];

function AreaStatsPanel({ stats, scope, onClose, lang }: { stats: AreaStats; scope: 'polygon' | 'place'; onClose: () => void; lang: Lang }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  const maxHist = Math.max(1, ...stats.heightHist.map((b) => b.count));
  return (
    <div className="mq-areastats">
      <div className="mq-as-head">
        <b>{scope === 'place' ? t('Whole place', 'Todo el lugar') : t('Drawn area', 'Área dibujada')}</b>
        <span className="mq-as-count">{fmtInt(stats.count)} {t('buildings', 'edificios')}</span>
        <button className="mq-as-close" onClick={onClose} title={t('Clear', 'Limpiar')}>✕</button>
      </div>
      {stats.count === 0 ? (
        <p className="mq-sub">{t('No buildings inside this area.', 'No hay edificios dentro de esta área.')}</p>
      ) : (
        <>
          <div className="mq-as-grid">
            {scope === 'polygon' && <Stat label={t('Area', 'Área')} value={fmtArea(stats.polygonAreaM2)} />}
            <Stat label={t('Footprint', 'Huella')} value={fmtArea(stats.footprintAreaM2)} />
            {scope === 'polygon' && <Stat label={t('Built cover', 'Cobertura')} value={`${Math.round(stats.coverageRatio * 100)}%`} />}
            {scope === 'polygon' && <Stat label={t('Density', 'Densidad')} value={`${fmtInt(stats.densityPerKm2)}/km2`} />}
            <Stat label={t('Built volume', 'Volumen')} value={`${fmtInt(stats.builtVolumeM3 / 1e6)} Mm3`} />
            {stats.height && <Stat label={t('Mean height', 'Altura media')} value={`${stats.height.mean.toFixed(1)} m`} />}
            {stats.height && <Stat label={t('Median h.', 'Mediana h.')} value={`${stats.height.median.toFixed(1)} m`} />}
            {stats.height && <Stat label={t('Tallest', 'Más alto')} value={`${stats.height.max.toFixed(0)} m`} />}
            {stats.floors && <Stat label={t('Mean floors', 'Pisos medio')} value={stats.floors.mean.toFixed(1)} />}
          </div>

          {stats.height && (
            <div className="mq-as-block">
              <span className="mq-sub">{t('Height distribution (m)', 'Distribución de altura (m)')}</span>
              <div className="mq-as-hist">
                {stats.heightHist.map((b) => (
                  <div key={b.label} className="mq-as-bar" title={`${b.label} m: ${b.count}`}>
                    <span style={{ height: `${(100 * b.count) / maxHist}%` }} />
                    <em>{b.label}</em>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mq-as-block">
            <span className="mq-sub">{t('Function', 'Función')}</span>
            <MixBar bins={stats.functionMix} total={stats.count} />
          </div>
          <div className="mq-as-block">
            <span className="mq-sub">{t('Land cover', 'Cobertura')}</span>
            <MixBar bins={stats.landcoverMix} total={stats.count} />
          </div>
          <div className="mq-as-block">
            <span className="mq-sub">{t('Height provenance (how we know)', 'Procedencia de altura')}</span>
            <MixBar bins={stats.provenanceMix} total={stats.count} />
          </div>
        </>
      )}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mq-as-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function SelectionPanel({ pick, lang, scene, colorMode, adminAttr }: { pick: PickInfo | null; lang: Lang; scene: MaquetaScene | null; colorMode: string; adminAttr: string | null }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  if (!pick)
    return <div className="mq-select-hint">{t('Click any building to select it (it highlights in 3D) and read all its fused attributes.', 'Al hacer clic en un edificio se selecciona (se resalta en 3D) y se ven todos sus atributos fusionados.')}</div>;
  const f = pick.feature;
  const p = PROVENANCE[f.height_source];
  // The value of whatever metric is currently active (the aggregate-by-area layer wins over the colour-by
  // attribute), resolved for THIS building: its own value, or its comuna's value for solar/climate/indicators.
  const activeKey = adminAttr ?? colorMode;
  const metric = scene?.metricForBuilding(f.id, activeKey, lang) ?? null;
  return (
    <div className="mq-select">
      <div className="mq-select-h">
        <b>{t('Building', 'Edificio')} #{f.id}</b>
        <span className="mq-select-height">{f.height_m.toFixed(1)} m</span>
      </div>
      {metric && (
        <div className="mq-select-metric">
          <span className="mq-select-metric-label">
            {metric.label}
            {metric.area && <i> · {metric.area}</i>}
          </span>
          <b className="mq-select-metric-val">{metric.text}</b>
        </div>
      )}
      <div className="mq-select-attrs">
        <span className="mq-src" style={{ background: rgbCss(p.rgb) }}>{t('height', 'altura')}: {p[lang]}</span>
        {f.num_floors != null && <span className="mq-tag">{f.num_floors} {t('floors', 'pisos')}</span>}
        {f.area_m2 != null && <span className="mq-tag">{f.area_m2.toLocaleString()} m2</span>}
        {f.use && <span className="mq-tag">{f.use}</span>}
        {f.roof_shape && <span className="mq-tag">{t('roof', 'techo')}: {f.roof_shape}</span>}
        {f.class != null && <span className="mq-muted">{WORLDCOVER_LABELS[f.class]?.[lang] ?? `class ${f.class}`}</span>}
        <span className="mq-muted">x={pick.point.x.toFixed(0)} m, z={(-pick.point.z).toFixed(0)} m</span>
      </div>
    </div>
  );
}
