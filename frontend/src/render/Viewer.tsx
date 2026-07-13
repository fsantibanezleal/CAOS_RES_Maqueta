// The App workbench: the 3D scene + a full control panel. Every fused source is a toggleable layer
// (with its provenance shown); buildings can be coloured by height / provenance / land use with a live
// legend; height and provenance filters operate over the building features; clicking a building
// highlights it in 3D and opens a detail panel. Scene dynamics: camera presets, neon intensity, pulse.
import { useEffect, useMemo, useRef, useState } from 'react';
import { readTheme } from '@fasl-work/caos-app-shell';
import { MaquetaScene, type ColorMode, type PickInfo } from './MaquetaScene';
import type { BundleManifest, BundleLayer } from '../lib/contract.types';
import { PROVENANCE, WORLDCOVER_LABELS, WORLDCOVER_RGB, rgbCss } from '../lib/labels';

type Lang = 'en' | 'es';
const LAYER_SWATCH: Record<string, string> = {
  terrain: '#464a52',
  buildings: '#c8a05a',
  roads: '#78c8ff',
  rail: '#ffa05a',
  water: '#005faf',
  green: '#2e783c',
  population: '#d64828',
};
const SOURCES: ('measured' | 'floors' | 'raster' | 'prior')[] = ['measured', 'floors', 'raster', 'prior'];

export function Viewer({
  baseUrl,
  manifest,
  lang,
}: {
  baseUrl: string;
  manifest: BundleManifest;
  lang: Lang;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MaquetaScene | null>(null);
  const [pick, setPick] = useState<PickInfo | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [colorMode, setColorMode] = useState<ColorMode>('height');
  const [hBounds, setHBounds] = useState<[number, number]>([0, 200]);
  const [hFilter, setHFilter] = useState<[number, number]>([0, 200]);
  const [srcOn, setSrcOn] = useState<Record<string, boolean>>({ measured: true, floors: true, raster: true, prior: true });
  const [neon, setNeon] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  useEffect(() => {
    if (!mountRef.current) return;
    const s = new MaquetaScene(mountRef.current, readTheme() === 'dark');
    s.setOnPick(setPick);
    sceneRef.current = s;
    const obs = new MutationObserver(() => s.setTheme(readTheme() === 'dark'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      obs.disconnect();
      s.dispose();
    };
  }, []);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    setLoading(true);
    setPick(null);
    s.loadBundle(baseUrl, manifest).then(() => {
      const v: Record<string, boolean> = {};
      // population is a heavy overlay: default it off so the city reads; the user opts in.
      manifest.layers.forEach((l) => (v[l.name] = l.name !== 'population'));
      manifest.layers.forEach((l) => s.setLayerVisible(l.name, v[l.name]));
      setVisible(v);
      const b = s.heightBounds();
      setHBounds(b);
      setHFilter(b);
      setColorMode('height');
      setLoading(false);
    });
  }, [baseUrl, manifest]);

  const setLayer = (name: string, on: boolean) => {
    setVisible((p) => ({ ...p, [name]: on }));
    sceneRef.current?.setLayerVisible(name, on);
  };
  const changeColor = (m: ColorMode) => {
    setColorMode(m);
    sceneRef.current?.setColorMode(m);
  };
  const changeHeight = (lo: number, hi: number) => {
    setHFilter([lo, hi]);
    sceneRef.current?.setHeightFilter(lo, hi);
  };
  const toggleSrc = (s: string) => {
    const next = { ...srcOn, [s]: !srcOn[s] };
    setSrcOn(next);
    sceneRef.current?.setSourceFilter(new Set(SOURCES.filter((x) => next[x])));
  };

  const classesInScene = useMemo(() => {
    // approximate: land-use legend shows built-up + whatever the scene likely holds
    return [50, 10, 30, 80, 40];
  }, []);
  const mix = manifest.stats.height_mix;

  return (
    <div className="mq-workbench">
      <div className="mq-stage">
        <div className="mq-canvas" ref={mountRef}>
          {loading && <div className="mq-loading">{t('Loading fused scene...', 'Cargando escena fusionada...')}</div>}
          <ColorLegend mode={colorMode} lang={lang} hBounds={hBounds} classes={classesInScene} />
        </div>
        <SelectionPanel pick={pick} lang={lang} />
      </div>

      <aside className="mq-panel">
        <Section title={t('Layers (the fused sources)', 'Capas (las fuentes fusionadas)')}>
          {manifest.layers.map((l) => (
            <LayerRow
              key={l.name}
              layer={l}
              on={visible[l.name] ?? true}
              swatch={LAYER_SWATCH[l.name] ?? '#888'}
              onToggle={(v) => setLayer(l.name, v)}
              lang={lang}
            />
          ))}
        </Section>

        <Section title={t('Colour buildings by', 'Colorear edificios por')}>
          <div className="mq-seg">
            {(['height', 'provenance', 'landuse'] as ColorMode[]).map((m) => (
              <button key={m} className={colorMode === m ? 'on' : ''} onClick={() => changeColor(m)}>
                {m === 'height' ? t('Height', 'Altura') : m === 'provenance' ? t('Provenance', 'Procedencia') : t('Land use', 'Uso de suelo')}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('Filter buildings', 'Filtrar edificios')}>
          <div className="mq-filter">
            <label>
              {t('Height', 'Altura')}: {hFilter[0].toFixed(0)}-{hFilter[1].toFixed(0)} m
            </label>
            <div className="mq-dual">
              <input
                type="range"
                min={hBounds[0]}
                max={hBounds[1]}
                value={hFilter[0]}
                onChange={(e) => changeHeight(Math.min(+e.target.value, hFilter[1]), hFilter[1])}
              />
              <input
                type="range"
                min={hBounds[0]}
                max={hBounds[1]}
                value={hFilter[1]}
                onChange={(e) => changeHeight(hFilter[0], Math.max(+e.target.value, hFilter[0]))}
              />
            </div>
          </div>
          <div className="mq-srcfilter">
            <span className="mq-sub">{t('By height source', 'Por fuente de altura')}</span>
            {SOURCES.map((s) => (
              <label key={s} className="mq-chip" style={{ borderColor: rgbCss(PROVENANCE[s].rgb) }}>
                <input type="checkbox" checked={srcOn[s]} onChange={() => toggleSrc(s)} />
                <i style={{ background: rgbCss(PROVENANCE[s].rgb) }} />
                {PROVENANCE[s][lang]} <span className="mq-muted">({mix[s] ?? 0})</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title={t('Scene', 'Escena')}>
          <div className="mq-seg">
            <button onClick={() => sceneRef.current?.cameraPreset('aerial')}>{t('Aerial', 'Cenital')}</button>
            <button onClick={() => sceneRef.current?.cameraPreset('oblique')}>{t('Oblique', 'Oblicua')}</button>
            <button onClick={() => sceneRef.current?.cameraPreset('street')}>{t('Street', 'Calle')}</button>
          </div>
          <label className="mq-slider">
            {t('Neon / glow', 'Neón / brillo')}
            <input type="range" min={0} max={2} step={0.05} value={neon} onChange={(e) => { setNeon(+e.target.value); sceneRef.current?.setNeon(+e.target.value); }} />
          </label>
          <label className="mq-chip">
            <input type="checkbox" checked={animate} onChange={(e) => { setAnimate(e.target.checked); sceneRef.current?.setAnimate(e.target.checked); }} />
            {t('Pulse animation', 'Animación de pulso')}
          </label>
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mq-section">
      <h4>{title}</h4>
      {children}
    </div>
  );
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

function ColorLegend({ mode, lang, hBounds, classes }: { mode: ColorMode; lang: Lang; hBounds: [number, number]; classes: number[] }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  return (
    <div className="mq-legend-box">
      <span className="mq-legend-title">
        {mode === 'height' ? t('Height', 'Altura') : mode === 'provenance' ? t('Height provenance', 'Procedencia de altura') : t('Land use', 'Uso de suelo')}
      </span>
      {mode === 'height' && (
        <div className="mq-ramp">
          <span className="mq-ramp-bar" />
          <div className="mq-ramp-lbl"><span>{hBounds[0]} m</span><span>{hBounds[1]} m</span></div>
        </div>
      )}
      {mode === 'provenance' && (
        <div className="mq-legend-list">
          {SOURCES.map((s) => (
            <span key={s}><i style={{ background: rgbCss(PROVENANCE[s].rgb) }} />{PROVENANCE[s][lang]}</span>
          ))}
        </div>
      )}
      {mode === 'landuse' && (
        <div className="mq-legend-list">
          {classes.map((c) => (
            <span key={c}><i style={{ background: rgbCss(WORLDCOVER_RGB[c] ?? [120, 120, 120]) }} />{WORLDCOVER_LABELS[c]?.[lang] ?? c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectionPanel({ pick, lang }: { pick: PickInfo | null; lang: Lang }) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  if (!pick)
    return (
      <div className="mq-select-hint">
        {t('Click any building to select it (it highlights in 3D) and read its height + provenance.', 'Haz clic en un edificio para seleccionarlo (se resalta en 3D) y ver su altura y procedencia.')}
      </div>
    );
  const f = pick.feature;
  const p = PROVENANCE[f.height_source];
  return (
    <div className="mq-select">
      <div className="mq-select-h">
        <b>{t('Building', 'Edificio')} #{f.id}</b>
        <span className="mq-select-height">{f.height_m.toFixed(1)} m</span>
      </div>
      <div className="mq-select-attrs">
        <span className="mq-src" style={{ background: rgbCss(p.rgb) }}>{p[lang]}</span>
        {f.class != null && <span className="mq-muted">{WORLDCOVER_LABELS[f.class]?.[lang] ?? `class ${f.class}`}</span>}
        <span className="mq-muted">x={pick.point.x.toFixed(0)} m, z={(-pick.point.z).toFixed(0)} m</span>
      </div>
    </div>
  );
}
