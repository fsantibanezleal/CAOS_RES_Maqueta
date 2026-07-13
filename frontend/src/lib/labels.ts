// ESA WorldCover class labels (EN/ES), keyed by class code. Mirrors geoscena.fetch.worldcover.CLASSES.
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
