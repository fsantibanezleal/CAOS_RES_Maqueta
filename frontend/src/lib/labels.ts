// ESA WorldCover class labels (EN/ES) + RGB, keyed by class code. Mirrors geoscena.fetch.worldcover.CLASSES.
export const WORLDCOVER_LABELS: Record<number, { en: string; es: string }> = {
  10: { en: 'Tree cover', es: 'Cobertura arbórea' },
  20: { en: 'Shrubland', es: 'Matorral' },
  30: { en: 'Grassland', es: 'Pastizal' },
  40: { en: 'Cropland', es: 'Cultivos' },
  50: { en: 'Built-up', es: 'Urbanizado' },
  60: { en: 'Bare / sparse', es: 'Suelo desnudo' },
  70: { en: 'Snow and ice', es: 'Nieve y hielo' },
  80: { en: 'Permanent water', es: 'Agua permanente' },
  90: { en: 'Herbaceous wetland', es: 'Humedal herbáceo' },
  95: { en: 'Mangroves', es: 'Manglares' },
  100: { en: 'Moss and lichen', es: 'Musgo y liquen' },
};

export const WORLDCOVER_RGB: Record<number, [number, number, number]> = {
  10: [0, 100, 0],
  20: [255, 187, 34],
  30: [255, 255, 76],
  40: [240, 150, 255],
  50: [200, 90, 90],
  60: [180, 180, 180],
  70: [240, 240, 240],
  80: [0, 100, 200],
  90: [0, 150, 160],
  95: [0, 207, 117],
  100: [250, 230, 160],
};

// Height-provenance rung colours + labels (the honest "how do we know" dimension).
export const PROVENANCE: Record<string, { rgb: [number, number, number]; en: string; es: string }> = {
  measured: { rgb: [46, 158, 111], en: 'Measured', es: 'Medida' },
  floors: { rgb: [74, 134, 232], en: 'From floors', es: 'Por pisos' },
  raster: { rgb: [214, 130, 21], en: 'Height raster', es: 'Raster de altura' },
  prior: { rgb: [154, 162, 173], en: 'Default prior', es: 'Valor por defecto' },
};

export const rgbCss = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
