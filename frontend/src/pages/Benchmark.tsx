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
          'Across every baked place (100+ cities, comunas, metro cores and terrain areas), this page reports how much of the reconstruction is measured vs inferred, the size/complexity budgets by tier, and the fused-vs-authoritative comparison against open LoD2 models where one exists. Every number is read straight from the committed benchmark.json.',
          'Sobre cada lugar precalculado (más de 100 ciudades, comunas, núcleos metropolitanos y áreas de relieve), esta página reporta cuánto de la reconstrucción es medido vs inferido, los presupuestos de tamaño/complejidad por tier, y la comparación fusión-vs-autoritativo contra modelos LoD2 abiertos donde exista. Cada número se lee directo del benchmark.json versionado.',
        )}
      </p>

      {err && (
        <p className="mq-error">
          {t('Run the pipeline (all places) to populate the benchmark.', 'Ejecutar el pipeline (todos los lugares) para poblar el benchmark.')}{' '}
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
              'For places with an open LoD2 model (currently 3D BAG for the Netherlands), the baked benchmark carries the fused-vs-authoritative height error: RMSE, MAE, bias and match coverage. This is the honest test of the fusion.',
              'Para lugares con un modelo LoD2 abierto (actualmente 3D BAG para Países Bajos), el benchmark precalculado lleva el error de altura fusión-vs-autoritativo: RMSE, MAE, sesgo y cobertura de emparejamiento. Es la prueba honesta de la fusión.',
            )}{' '}
            <Cite id="3dbag" /> <Cite id="usgs3dep" />
          </p>
          {(() => {
            const gt = bench.per_place.filter((p) => p.ground_truth);
            return gt.length ? (
              <div className="mq-tablewrap">
                <table className="mq-table">
                  <thead>
                    <tr>
                      <th>{t('Place', 'Lugar')}</th>
                      <th>{t('Ground truth', 'Verdad de terreno')}</th>
                      <th>{t('Height RMSE', 'RMSE altura')}</th>
                      <th>MAE</th>
                      <th>{t('Bias', 'Sesgo')}</th>
                      <th>{t('Matched', 'Emparejados')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gt.map((p) => (
                      <tr key={p.slug}>
                        <td>{p.name}</td>
                        <td className="mq-muted">{p.ground_truth!.truth_source}</td>
                        <td><b>{p.ground_truth!.height_rmse_m} m</b></td>
                        <td>{p.ground_truth!.height_mae_m} m</td>
                        <td>{p.ground_truth!.height_bias_m > 0 ? '+' : ''}{p.ground_truth!.height_bias_m} m</td>
                        <td>{p.ground_truth!.matched.toLocaleString()} / {p.ground_truth!.n_fused.toLocaleString()} ({p.ground_truth!.coverage_pct}%)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mq-muted">{t('(Ground-truth rows appear once the Netherlands tier-A places are baked with the 3D BAG comparison.)', '(Las filas de verdad de terreno aparecen cuando los lugares tier-A de Países Bajos se precalculan con la comparación 3D BAG.)')}</p>
            );
          })()}

          <Refs ids={['overture', 'openbuildings25d', '3dbag', 'usgs3dep', 'demcompare']} label={t('References', 'Referencias')} />
        </>
      )}
    </section>
  );
}
