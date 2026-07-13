// Benchmark: the honest cross-place summary. Global height-provenance mix, byte/triangle budgets by
// tier, and (where a place has a LoD2 ground truth) the reconstruction-vs-authoritative comparison.
import { useEffect, useState } from 'react';
import { Cite, Refs, useShellLang } from '@fasl-work/caos-app-shell';
import { loadBenchmark } from '../lib/data';
import type { Benchmark as BenchmarkData } from '../lib/contract.types';

const MIX_COLORS: Record<string, string> = {
  measured: 'var(--mq-measured)',
  floors: 'var(--mq-floors)',
  raster: 'var(--mq-raster)',
  prior: 'var(--mq-prior)',
};

export default function Benchmark() {
  const es = useShellLang() === 'es';
  const t = (en: string, esv: string) => (es ? esv : en);
  const [bench, setBench] = useState<BenchmarkData | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    loadBenchmark().then(setBench).catch((e) => setErr(String(e)));
  }, []);

  const mixKeys = ['measured', 'floors', 'raster', 'prior'] as const;

  return (
    <section className="page-body prose">
      <h2>Benchmark</h2>
      <p className="mq-lead">
        {t(
          'The point of Maqueta is honesty at scale. This page reports, across all baked places, how much of the reconstruction is measured vs inferred, the size/complexity budgets, and the comparison against authoritative LoD2 models where one exists.',
          'El sentido de Maqueta es la honestidad a escala. Esta página reporta, sobre todos los lugares horneados, cuánto de la reconstrucción es medido vs inferido, los presupuestos de tamaño/complejidad, y la comparación contra modelos LoD2 autoritativos donde exista.',
        )}
      </p>

      {err && (
        <p className="mq-error">
          {t('Run the pipeline (all places) to populate the benchmark.', 'Ejecuta el pipeline (todos los lugares) para poblar el benchmark.')}{' '}
          <code>{err}</code>
        </p>
      )}

      {bench && (
        <>
          <h3>{t('Global height provenance', 'Procedencia global de alturas')}</h3>
          <p>
            {t(
              `Across ${bench.n_places} place(s), the height of every building traces to one of four rungs:`,
              `Sobre ${bench.n_places} lugar(es), la altura de cada edificio se remonta a una de cuatro fuentes:`,
            )}
          </p>
          <div className="mq-stack">
            {mixKeys.map((k) => {
              const frac = bench.global_height_fraction[k] ?? 0;
              return (
                <div
                  key={k}
                  className="mq-stack-seg"
                  style={{ width: `${frac * 100}%`, background: MIX_COLORS[k] }}
                  title={`${k}: ${(frac * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="mq-legend">
            {mixKeys.map((k) => (
              <span key={k}>
                <i style={{ background: MIX_COLORS[k] }} /> {k} ({((bench.global_height_fraction[k] ?? 0) * 100).toFixed(0)}%)
              </span>
            ))}
          </div>

          <h3>{t('Budgets by tier', 'Presupuestos por tier')}</h3>
          <div className="mq-tablewrap">
            <table className="mq-table">
              <thead>
                <tr>
                  <th>{t('Tier', 'Tier')}</th>
                  <th>{t('Places', 'Lugares')}</th>
                  <th>{t('Total MB', 'MB totales')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(bench.tier_counts)
                  .sort()
                  .map((tier) => (
                    <tr key={tier}>
                      <td>{tier}</td>
                      <td>{bench.tier_counts[tier]}</td>
                      <td>{(bench.tier_totals_mb[tier] ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                <tr className="mq-total">
                  <td>{t('All', 'Todos')}</td>
                  <td>{bench.n_places}</td>
                  <td>{bench.total_mb.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>{t('Ground-truth comparison (tier A)', 'Comparación con verdad de terreno (tier A)')}</h3>
          <p>
            {t(
              'For places with an open LoD2/lidar model (3D BAG, PLATEAU, USGS 3DEP), the baked benchmark also carries the fused-vs-authoritative height RMSE and footprint IoU. These land as the tier-A ground-truth layer is wired per place.',
              'Para lugares con un modelo LoD2/lidar abierto (3D BAG, PLATEAU, USGS 3DEP), el benchmark horneado lleva además el RMSE de altura y el IoU de huella de la fusión vs lo autoritativo. Se completan a medida que se conecta la capa de verdad de terreno por lugar.',
            )}{' '}
            <Cite id="3dbag" /> <Cite id="usgs3dep" />
          </p>

          <Refs ids={['overture', 'openbuildings25d', '3dbag', 'usgs3dep', 'demcompare']} label={t('References', 'Referencias')} />
        </>
      )}
    </section>
  );
}
