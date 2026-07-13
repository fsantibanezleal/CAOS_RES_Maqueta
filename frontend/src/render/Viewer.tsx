// The App workbench: the 3D scene + a full attribute-driven control panel. Every fused source is a
// toggleable layer (with provenance shown); buildings can be coloured by ANY attribute (height,
// provenance, function, floors, area, land cover, and future fused modalities) with a live legend;
// numeric attributes get range filters and categorical ones get value filters, all operating over the
// building features and combined with AND; clicking a building highlights it in 3D and opens a detail
// panel. Scene dynamics: camera presets, neon intensity, pulse. Edges give each extrusion 3D shape.
import { useEffect, useMemo, useRef, useState } from 'react';
import { readTheme } from '@fasl-work/caos-app-shell';
import { MaquetaScene, type AttrSpec, type PickInfo } from './MaquetaScene';
import type { BundleManifest, BundleLayer } from '../lib/contract.types';
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
  const [loading, setLoading] = useState(true);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  useEffect(() => {
    if (!mountRef.current) return;
    const s = new MaquetaScene(mountRef.current, readTheme() === 'dark');
    s.setOnPick(setPick);
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
      setColorMode('height');
      s.setColorMode('height');
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
    });
  }, [baseUrl, manifest]);

  const setLayer = (name: string, on: boolean) => {
    setVisible((p) => ({ ...p, [name]: on }));
    sceneRef.current?.setLayerVisible(name, on);
  };
  const changeColor = (k: string) => { setColorMode(k); sceneRef.current?.setColorMode(k); };
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

  const colorAttrs = useMemo(() => attrs, [attrs]);
  const numericAttrs = attrs.filter((a) => a.kind === 'numeric');
  const categoricalAttrs = attrs.filter((a) => a.kind === 'categorical');

  return (
    <div className="mq-workbench">
      <div className="mq-stage">
        <div className="mq-canvas" ref={mountRef}>
          {loading && <div className="mq-loading">{t('Loading fused scene...', 'Cargando escena fusionada...')}</div>}
          {!loading && buildingsLoading && (
            <div className="mq-streaming">{t('Loading full detail...', 'Cargando detalle completo...')}</div>
          )}
          {!loading && <ColorLegend scene={sceneRef.current} attrKey={colorMode} lang={lang} />}
        </div>
        <SelectionPanel pick={pick} lang={lang} />
      </div>

      <aside className="mq-panel">
        <Section title={t('Layers (the fused modalities)', 'Capas (las modalidades fusionadas)')}>
          {manifest.layers.filter((l) => l.name !== 'buildings_lite').map((l) => (
            <LayerRow key={l.name} layer={l} on={visible[l.name] ?? true} swatch={LAYER_SWATCH[l.name] ?? '#888'}
              onToggle={(v) => setLayer(l.name, v)} lang={lang} />
          ))}
        </Section>

        <Section title={t('Colour buildings by', 'Colorear edificios por')}>
          <div className="mq-seg mq-seg-wrap">
            {colorAttrs.map((a) => (
              <button key={a.key} className={colorMode === a.key ? 'on' : ''} onClick={() => changeColor(a.key)}>
                {a[lang]}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('Filter buildings', 'Filtrar edificios')}>
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

        <Section title={t('Scene', 'Escena')}>
          <div className="mq-seg">
            <button onClick={() => sceneRef.current?.cameraPreset('aerial')}>{t('Aerial', 'Cenital')}</button>
            <button onClick={() => sceneRef.current?.cameraPreset('oblique')}>{t('Oblique', 'Oblicua')}</button>
            <button onClick={() => sceneRef.current?.cameraPreset('street')}>{t('Street', 'Calle')}</button>
          </div>
          <label className="mq-slider">{t('Neon / glow', 'Neon / brillo')}
            <input type="range" min={0} max={2} step={0.05} value={neon} onChange={(e) => { setNeon(+e.target.value); sceneRef.current?.setNeon(+e.target.value); }} />
          </label>
          <label className="mq-chip"><input type="checkbox" checked={animate} onChange={(e) => { setAnimate(e.target.checked); sceneRef.current?.setAnimate(e.target.checked); }} />{t('Pulse animation', 'Animacion de pulso')}</label>
          <label className="mq-chip"><input type="checkbox" checked={edges} onChange={(e) => { setEdgesState(e.target.checked); sceneRef.current?.setEdges(e.target.checked); }} />{t('Wireframe (building edges)', 'Malla (bordes de edificios)')}</label>
          {edgesLarge && <p className="mq-sub">{t('Large scene: edges are off by default for a fast load; enable to read building shape (may take a moment).', 'Escena grande: la malla viene apagada para cargar rapido; actívala para ver la forma de los edificios (puede tardar un momento).')}</p>}
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mq-section"><h4>{title}</h4>{children}</div>;
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

function SelectionPanel({ pick, lang }: { pick: PickInfo | null; lang: Lang }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  if (!pick)
    return <div className="mq-select-hint">{t('Click any building to select it (it highlights in 3D) and read all its fused attributes.', 'Haz clic en un edificio para seleccionarlo (se resalta en 3D) y ver todos sus atributos fusionados.')}</div>;
  const f = pick.feature;
  const p = PROVENANCE[f.height_source];
  return (
    <div className="mq-select">
      <div className="mq-select-h">
        <b>{t('Building', 'Edificio')} #{f.id}</b>
        <span className="mq-select-height">{f.height_m.toFixed(1)} m</span>
      </div>
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
