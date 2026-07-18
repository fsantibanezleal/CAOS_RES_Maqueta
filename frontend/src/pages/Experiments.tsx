// Experiments (ADR-0016 §9C): the experiment design, the metrics, the leakage-safe protocol, a coverage
// read across tiers, and the real per-place results, all read from the baked benchmark.json. Not a card
// grid; nothing is computed in the browser.
import { useEffect, useState } from 'react';
import { Callout, Cite, Refs, Tabs, useShellLang } from '@fasl-work/caos-app-shell';
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

  const DESIGN = (
    <div className="mq-method">
      <p>
        {t(
          'Each place is an experiment in multi-modal fusion under a different data regime: OSM-rich cities where most heights are measured; Global-South cities that lean on the Open Buildings 2.5D raster; terrain-first areas with little built-up; and tier-A cities with an authoritative LoD2 model to test against. The registry is designed to span those regimes on purpose, so the honesty of the fusion is visible across very different data availabilities.',
          'Cada lugar es un experimento de fusión multi-modal bajo un régimen de datos distinto: ciudades ricas en OSM donde casi todas las alturas son medidas; ciudades del Sur Global que dependen del raster 2.5D de Open Buildings; áreas de relieve con poco construido; y ciudades tier-A con un modelo LoD2 autoritativo contra el cual medir. El registro está diseñado para abarcar esos regímenes a propósito, para que la honestidad de la fusión sea visible en disponibilidades de datos muy distintas.',
        )}{' '}
        <Cite id="fusionlevels" />
      </p>
      <h4>{t('Metrics', 'Métricas')}</h4>
      <ul>
        <li><b>{t('Measured-height %', '% de altura medida')}</b>: {t('share of buildings whose height is a real measurement (Overture/OSM), not an inference.', 'proporción de edificios cuya altura es una medición real (Overture/OSM), no una inferencia.')}</li>
        <li><b>{t('Layer coverage', 'Cobertura de capas')}</b>: {t('how many modalities were available and fused for the place (terrain, buildings, roads, context, population, analytical layers).', 'cuántas modalidades hubo y se fusionaron para el lugar (relieve, edificios, calles, contexto, población, capas analíticas).')}</li>
        <li><b>{t('Mesh budget', 'Presupuesto de malla')}</b>: {t('triangles and delivered megabytes, the cost of the scene after meshopt compression.', 'triángulos y megabytes entregados, el costo de la escena tras la compresión meshopt.')}</li>
        <li><b>{t('Ground-truth error', 'Error vs verdad de terreno')}</b>: {t('where an open LoD2 exists, the fused-vs-authoritative height RMSE, MAE and bias (see Benchmark).', 'donde existe un LoD2 abierto, el RMSE, MAE y sesgo de altura fusión-vs-autoritativo (ver Benchmark).')}</li>
      </ul>
      <Callout variant="strong" title={t('Leakage-safe protocol', 'Protocolo sin fuga')}>
        {t('The LoD2 ground truth is never used to build the fused heights: heights come only from the provenance ladder, and the authoritative model is held out and compared post-hoc. Every number on this page is baked offline by the pipeline into benchmark.json; nothing is computed in the browser, so the results cannot drift with the viewer.',
          'La verdad LoD2 nunca se usa para construir las alturas fusionadas: las alturas vienen solo de la escalera de procedencia, y el modelo autoritativo se reserva y se compara después. Cada número de esta página se precalcula offline en benchmark.json; nada se calcula en el navegador, así los resultados no pueden derivar con el visor.')}
      </Callout>
    </div>
  );

  const COVERAGE = bench ? (
    <div className="mq-method">
      <p>{t(`Across ${bench.n_places} baked place(s), grouped by tier:`, `Sobre ${bench.n_places} lugar(es) precalculados, agrupados por tier:`)}</p>
      <div className="mq-tablewrap">
        <table className="mq-table">
          <thead><tr><th>{t('Tier', 'Tier')}</th><th>{t('Places', 'Lugares')}</th><th>{t('Total MB', 'MB totales')}</th></tr></thead>
          <tbody>
            {Object.keys(bench.tier_counts).sort().map((tier) => (
              <tr key={tier}><td>{tier}</td><td>{bench.tier_counts[tier]}</td><td>{(bench.tier_totals_mb[tier] ?? 0).toFixed(1)}</td></tr>
            ))}
            <tr className="mq-total"><td>{t('All', 'Todos')}</td><td>{bench.n_places}</td><td>{bench.total_mb.toFixed(1)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mq-muted">
        {t('Tier A = ground-truth (open LoD2/lidar); Tier B = global-fusion cities (heights via the ladder), including the metro cores that span official sub-areas; Tier C = terrain-first areas. The global measured-vs-inferred height mix is on the Benchmark page.',
          'Tier A = verdad de terreno (LoD2/lidar abierto); Tier B = ciudades por fusión global (alturas por la escalera), incluidos los núcleos metropolitanos que abarcan subáreas oficiales; Tier C = áreas de relieve. La mezcla global medido-vs-inferido está en la página Benchmark.')}
      </p>
    </div>
  ) : <p className="mq-muted">{t('Loading...', 'Cargando...')}</p>;

  const RESULTS = bench ? (
    <div className="mq-method">
      <p>{t('The fusion result per place: layers fused, mesh budget, and the measured-height share. The measured share varies sharply by region.',
        'El resultado de fusión por lugar: capas fusionadas, presupuesto de malla, y la proporción de altura medida. La proporción medida varía fuertemente por región.')}</p>
      <div className="mq-tablewrap" style={{ maxHeight: 480, overflowY: 'auto' }}>
        <table className="mq-table">
          <thead>
            <tr>
              <th>{t('Place', 'Lugar')}</th><th>{t('Tier', 'Tier')}</th><th>{t('Layers', 'Capas')}</th>
              <th>{t('Triangles', 'Triángulos')}</th><th>MB</th><th>{t('Measured height', 'Altura medida')}</th>
            </tr>
          </thead>
          <tbody>
            {bench.per_place.map((p) => (
              <tr key={p.slug}>
                <td>{p.name} <span className="mq-muted">({p.country})</span></td>
                <td>{p.tier}</td>
                <td>{p.n_layers}</td>
                <td>{p.total_triangles.toLocaleString()}</td>
                <td>{p.total_mb.toFixed(2)}</td>
                <td><div className="mq-bar"><span style={{ width: `${p.measured_pct}%` }} /></div>{p.measured_pct.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Refs ids={['fusionlevels', 'overture', 'openbuildings25d', '3dbag']} label={t('References', 'Referencias')} />
    </div>
  ) : <p className="mq-muted">{t('Loading...', 'Cargando...')}</p>;

  return (
    <section className="page-body prose">
      <h2>{t('Experiments', 'Experimentos')}</h2>
      <p className="mq-lead">
        {t('Every place is an experiment in multi-modal fusion. The design spans data regimes on purpose; the metrics and a leakage-safe protocol keep the results honest; the numbers are baked offline into benchmark.json, never computed in the browser.',
          'Cada lugar es un experimento de fusión multi-modal. El diseño abarca regímenes de datos a propósito; las métricas y un protocolo sin fuga mantienen los resultados honestos; los números se precalculan offline en benchmark.json, nunca se calculan en el navegador.')}
      </p>
      {err && <p className="mq-error">{t('Run the pipeline to populate this page.', 'Ejecutar el pipeline para poblar esta página.')} <code>{err}</code></p>}
      <Tabs
        ariaLabel={t('Experiment sections', 'Secciones del experimento')}
        tabs={[
          { id: 'design', label: t('Design & metrics', 'Diseño y métricas'), content: DESIGN },
          { id: 'coverage', label: t('Coverage', 'Cobertura'), content: COVERAGE },
          { id: 'results', label: t('Per-place results', 'Resultados por lugar'), content: RESULTS },
        ]}
      />
    </section>
  );
}
