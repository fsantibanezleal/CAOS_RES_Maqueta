// Experiments: what the fusion actually produces per place, read from the baked benchmark. Not a card
// grid: a real cross-place read of layer coverage, mesh budgets and the height-provenance mix.
import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import { loadBenchmark } from '../lib/data';
import type { Benchmark } from '../lib/contract.types';

export default function Experiments() {
  const es = useShellLang() === 'es';
  const t = (en: string, esv: string) => (es ? esv : en);
  const [bench, setBench] = useState<Benchmark | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    loadBenchmark().then(setBench).catch((e) => setErr(String(e)));
  }, []);

  return (
    <section className="page-body prose">
      <h2>{t('Experiments', 'Experimentos')}</h2>
      <p className="mq-lead">
        {t(
          'Each place is an experiment in multi-source fusion: which layers were available, how much of the height came from measurement vs inference, and the mesh budget it cost. These numbers are baked offline by the pipeline; nothing is computed in the browser.',
          'Cada lugar es un experimento de fusión multi-fuente: qué capas hubo, cuánta altura vino de medición vs inferencia, y el presupuesto de malla que costó. Estos números se hornean offline; nada se calcula en el navegador.',
        )}
      </p>

      {err && (
        <p className="mq-error">
          {t('Run the pipeline to populate this page.', 'Ejecuta el pipeline para poblar esta página.')} <code>{err}</code>
        </p>
      )}

      {bench && (
        <>
          <h3>{t('Per-place fusion result', 'Resultado de fusión por lugar')}</h3>
          <div className="mq-tablewrap">
            <table className="mq-table">
              <thead>
                <tr>
                  <th>{t('Place', 'Lugar')}</th>
                  <th>{t('Tier', 'Tier')}</th>
                  <th>{t('Layers', 'Capas')}</th>
                  <th>{t('Triangles', 'Triángulos')}</th>
                  <th>MB</th>
                  <th>{t('Measured height', 'Altura medida')}</th>
                </tr>
              </thead>
              <tbody>
                {bench.per_place.map((p) => (
                  <tr key={p.slug}>
                    <td>
                      {p.name} <span className="mq-muted">({p.country})</span>
                    </td>
                    <td>{p.tier}</td>
                    <td>{p.n_layers}</td>
                    <td>{p.total_triangles.toLocaleString()}</td>
                    <td>{p.total_mb.toFixed(2)}</td>
                    <td>
                      <div className="mq-bar">
                        <span style={{ width: `${p.measured_pct}%` }} />
                      </div>
                      {p.measured_pct.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mq-muted">
            {t(
              'Measured-height % is the share of buildings whose height is a real measurement (Overture/OSM), not an inference. It varies sharply by region: OSM-rich cities are high; Global-South cities lean on the 2.5D raster and default priors.',
              'El % de altura medida es la proporción de edificios cuya altura es una medición real (Overture/OSM), no una inferencia. Varía fuerte por región: las ciudades ricas en OSM son altas; las del Sur Global dependen del raster 2.5D y de valores por defecto.',
            )}
          </p>
        </>
      )}
    </section>
  );
}
