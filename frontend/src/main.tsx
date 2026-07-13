import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { AppShell, applyTheme, readTheme, CitationsProvider, type ShellConfig } from '@fasl-work/caos-app-shell';
import '@fasl-work/caos-app-shell/styles.css';
import './maqueta.css';
import { CITATIONS } from './data/citations';
import { architecture } from './architecture';
import { EXTERNAL_LINKS } from './lib/links';
import pkg from '../package.json';

import AppPage from './pages/AppPage';
import Introduction from './pages/Introduction';
import Methodology from './pages/Methodology';
import Implementation from './pages/Implementation';
import Experiments from './pages/Experiments';
import Benchmark from './pages/Benchmark';

// Display version X.XX.XXX derived from the semver manifest (single source, no drift).
const displayVersion = pkg.version
  .split('.')
  .map((p, i) => (i === 0 ? p : p.padStart(i === 1 ? 2 : 3, '0')))
  .join('.');

applyTheme(readTheme());

const config: ShellConfig = {
  product: { name: 'Maqueta', mark: <Boxes size={18} aria-hidden="true" /> },
  routes: [
    { path: '/', en: 'App', es: 'App' },
    { path: '/introduction', en: 'Introduction', es: 'Introducción' },
    { path: '/methodology', en: 'Methodology', es: 'Metodología' },
    { path: '/implementation', en: 'Implementation', es: 'Implementación' },
    { path: '/experiments', en: 'Experiments', es: 'Experimentos' },
    { path: '/benchmark', en: 'Benchmark', es: 'Benchmark' },
  ],
  links: {
    github: EXTERNAL_LINKS.github,
    personal: EXTERNAL_LINKS.personal,
    portfolio: EXTERNAL_LINKS.portfolio,
  },
  version: displayVersion,
  architecture,
  footer: {
    provenance: {
      en: 'Every place is a multi-modal fusion, assembled offline by the geoscena pipeline from open public geodata across modalities: building footprints (Overture), terrain (Copernicus GLO-30), land cover (ESA WorldCover), water / green / rail (OpenStreetMap), population (GHS-POP), 2.5D building heights (Google Open Buildings) and LoD2 ground truth (3DBAG). Each layer carries its source, license and fetch date; each building records the provenance of its height. Nothing is invented.',
      es: 'Cada lugar es una fusión multi-modal, ensamblada offline por el pipeline geoscena a partir de geodatos públicos abiertos de varias modalidades: huellas de edificios (Overture), relieve (Copernicus GLO-30), cobertura de suelo (ESA WorldCover), agua / verde / vías (OpenStreetMap), población (GHS-POP), alturas 2.5D (Google Open Buildings) y verdad de terreno LoD2 (3DBAG). Cada capa lleva su fuente, licencia y fecha; cada edificio registra la procedencia de su altura. Nada es inventado.',
    },
    disclaimer: {
      en: 'A research reconstruction: heights are labelled by provenance (measured vs inferred), terrain from a global 30 m DSM sits slightly high in dense cores, and non-commercial layers are flagged per scene.',
      es: 'Una reconstrucción de investigación: las alturas se etiquetan por procedencia (medida vs inferida), el relieve de un DSM global de 30 m queda algo alto en centros densos, y las capas no comerciales se marcan por escena.',
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CitationsProvider items={CITATIONS}>
        <AppShell config={config}>
          <Routes>
            <Route path="/" element={<AppPage />} />
            <Route path="/introduction" element={<Introduction />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/implementation" element={<Implementation />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/benchmark" element={<Benchmark />} />
            <Route path="*" element={<AppPage />} />
          </Routes>
        </AppShell>
      </CitationsProvider>
    </BrowserRouter>
  </StrictMode>,
);
