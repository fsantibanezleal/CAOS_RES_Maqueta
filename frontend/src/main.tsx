import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { AppShell, applyTheme, readTheme, CitationsProvider, useLangStore, type ShellConfig } from '@fasl-work/caos-app-shell';
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

// English is the default UI language. Only force it when the visitor has no stored choice yet, so the
// language toggle still sticks for anyone who switches to Spanish (the shell persists under "caos.lang").
if (typeof localStorage !== 'undefined' && !localStorage.getItem('caos.lang')) {
  useLangStore.getState().setLang('en');
}

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
      en: 'Data: a multi-modal fusion assembled offline by the geoscena pipeline from open public geodata: building footprints (Overture, ODbL), terrain (Copernicus GLO-30), land cover (ESA WorldCover), water / green / rail (OpenStreetMap), population (GHS-POP), 2.5D heights (Google Open Buildings), LoD2 ground truth (3DBAG), satellite multispectral NDVI/NDWI/NDBI (Copernicus Sentinel-2), solar potential (PVGIS), climate normals (Open-Meteo ERA5), admin sub-areas (geoBoundaries, CC-BY) and Chilean socio-economic indicators (Data Observatory). Each layer carries its source, license and fetch date. Code: Apache-2.0. Nothing is invented.',
      es: 'Datos: una fusión multi-modal ensamblada offline por el pipeline geoscena a partir de geodatos públicos abiertos: huellas de edificios (Overture, ODbL), relieve (Copernicus GLO-30), cobertura de suelo (ESA WorldCover), agua / verde / vías (OpenStreetMap), población (GHS-POP), alturas 2.5D (Google Open Buildings), verdad LoD2 (3DBAG), multiespectral satelital NDVI/NDWI/NDBI (Copernicus Sentinel-2), potencial solar (PVGIS), clima (Open-Meteo ERA5), sub-areas administrativas (geoBoundaries, CC-BY) e indicadores socioeconomicos chilenos (Observatorio de Datos). Cada capa lleva su fuente, licencia y fecha. Codigo: Apache-2.0. Nada es inventado.',
    },
    disclaimer: {
      en: 'A research reconstruction: heights are labelled by provenance (measured vs inferred); terrain from a global 30 m DSM sits slightly high in dense cores; the satellite indices are single-scene surface proxies; solar/climate are near-constant per AOI (aggregated per comuna); non-commercial layers are flagged per scene.',
      es: 'Una reconstruccion de investigacion: las alturas se etiquetan por procedencia (medida vs inferida); el relieve de un DSM global de 30 m queda algo alto en centros densos; los indices satelitales son proxies de superficie de una sola escena; solar/clima son casi constantes por AOI (agregados por comuna); las capas no comerciales se marcan por escena.',
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
