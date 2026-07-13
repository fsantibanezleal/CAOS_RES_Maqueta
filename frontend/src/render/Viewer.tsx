// React host for the Three.js MaquetaScene: mounts the canvas, loads the selected place's bundle,
// wires the layer toggles / camera presets / animation, and surfaces the picked building read-out.
import { useEffect, useRef, useState } from 'react';
import { readTheme } from '@fasl-work/caos-app-shell';
import { MaquetaScene, type PickInfo } from './MaquetaScene';
import type { BundleManifest } from '../lib/contract.types';
import { WORLDCOVER_LABELS } from '../lib/labels';

const SOURCE_LABEL: Record<string, { en: string; es: string }> = {
  measured: { en: 'measured height', es: 'altura medida' },
  floors: { en: 'from floor count', es: 'por num. de pisos' },
  raster: { en: 'from height raster', es: 'por raster de altura' },
  prior: { en: 'default prior', es: 'valor por defecto' },
};

export function Viewer({
  baseUrl,
  manifest,
  lang,
}: {
  baseUrl: string;
  manifest: BundleManifest;
  lang: 'en' | 'es';
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MaquetaScene | null>(null);
  const [pick, setPick] = useState<PickInfo | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(true);

  // create the scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const dark = readTheme() === 'dark';
    const scene = new MaquetaScene(mountRef.current, dark);
    scene.setOnPick(setPick);
    sceneRef.current = scene;
    return () => scene.dispose();
  }, []);

  // load the bundle when the place changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    setLoading(true);
    setPick(null);
    scene.loadBundle(baseUrl, manifest).then(() => {
      const v: Record<string, boolean> = {};
      manifest.layers.forEach((l) => (v[l.name] = true));
      setVisible(v);
      setLoading(false);
    });
  }, [baseUrl, manifest]);

  const toggle = (name: string) => {
    const nv = { ...visible, [name]: !visible[name] };
    setVisible(nv);
    sceneRef.current?.setLayerVisible(name, nv[name]);
  };

  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  return (
    <div className="mq-viewer">
      <div className="mq-canvas" ref={mountRef}>
        {loading && <div className="mq-loading">{t('Loading scene...', 'Cargando escena...')}</div>}
      </div>

      <div className="mq-controls">
        <div className="mq-ctl-group">
          <span className="mq-ctl-title">{t('Layers', 'Capas')}</span>
          {manifest.layers.map((l) => (
            <label key={l.name} className="mq-chip">
              <input
                type="checkbox"
                checked={visible[l.name] ?? true}
                onChange={() => toggle(l.name)}
              />
              {l.name} <span className="mq-muted">({l.stats.triangles ?? l.stats.points})</span>
            </label>
          ))}
        </div>

        <div className="mq-ctl-group">
          <span className="mq-ctl-title">{t('Camera', 'Cámara')}</span>
          <button onClick={() => sceneRef.current?.cameraPreset('aerial')}>{t('Aerial', 'Cenital')}</button>
          <button onClick={() => sceneRef.current?.cameraPreset('oblique')}>{t('Oblique', 'Oblicua')}</button>
          <button onClick={() => sceneRef.current?.cameraPreset('street')}>{t('Street', 'Calle')}</button>
        </div>

        <div className="mq-ctl-group">
          <label className="mq-chip">
            <input
              type="checkbox"
              checked={animate}
              onChange={(e) => {
                setAnimate(e.target.checked);
                sceneRef.current?.setAnimate(e.target.checked);
              }}
            />
            {t('Scan pulse', 'Pulso de escaneo')}
          </label>
        </div>
      </div>

      <div className="mq-readout">
        {pick?.feature ? (
          <>
            <b>{t('Building', 'Edificio')} #{pick.feature.id}</b>
            <span>
              {t('Height', 'Altura')}: <b>{pick.feature.height_m.toFixed(1)} m</b>
            </span>
            <span className={`mq-src mq-src-${pick.feature.height_source}`}>
              {SOURCE_LABEL[pick.feature.height_source]?.[lang] ?? pick.feature.height_source}
            </span>
            {pick.feature.class != null && (
              <span className="mq-muted">
                {WORLDCOVER_LABELS[pick.feature.class]?.[lang] ?? `class ${pick.feature.class}`}
              </span>
            )}
          </>
        ) : (
          <span className="mq-muted">
            {t('Click a building to read its height + provenance', 'Clic en un edificio para ver su altura y procedencia')}
          </span>
        )}
      </div>
    </div>
  );
}
