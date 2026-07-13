// TypeScript mirror of the geoscena SceneBundle manifest (CONTRACT 2, processing -> web).
// If the Python manifest schema drifts from these types, the build (tsc) fails. See
// CAOS_GeoScena/docs/contract.md and geoscena.bundle.SceneBundle.to_manifest.

export interface LayerProvenance {
  source: string;
  url: string;
  license: string;
  license_name: string;
  license_url: string;
  commercial_ok: boolean | null;
  fetched: string;
  method: string;
  extra: Record<string, unknown>;
}

export interface LayerStats {
  kind: 'mesh' | 'points';
  vertices?: number;
  triangles?: number;
  features?: number;
  points?: number;
}

export interface BundleLayer {
  name: string;
  file: string;
  stats: LayerStats;
  provenance: LayerProvenance;
}

export interface AoiInfo {
  name: string;
  bbox_wgs84: [number, number, number, number];
  origin_wgs84: [number, number];
  crs_local: string;
  size_m: [number, number];
}

export interface HeightMix {
  measured: number;
  floors: number;
  raster: number;
  prior: number;
}

export interface BundleManifest {
  schema_version: number;
  aoi: AoiInfo;
  layers: BundleLayer[];
  stats: {
    layers: string[];
    height_mix: HeightMix;
    budgets: Record<string, LayerStats>;
    notes: string[];
  };
  any_noncommercial: boolean;
  credits: string[];
}

// data/derived/index.json
export interface PlaceIndexEntry {
  slug: string;
  name: string;
  tier: 'A' | 'B' | 'C';
  category: string;
  continent: string;
  country: string;
  city: string;
  n_layers: number;
  total_bytes: number;
  manifest_path: string;
}

export interface HierCity {
  city: string;
  slugs: string[];
}
export interface HierCountry {
  country: string;
  cities: HierCity[];
}
export interface HierContinent {
  continent: string;
  countries: HierCountry[];
}

export interface PlaceIndex {
  schema_version: number;
  n_places: number;
  tiers: Record<string, string[]>;
  hierarchy?: HierContinent[];
  places: PlaceIndexEntry[];
}

// data/derived/benchmark.json
export interface GroundTruth {
  n_fused: number;
  n_truth: number;
  matched: number;
  coverage_pct: number;
  height_rmse_m: number;
  height_mae_m: number;
  height_bias_m: number;
  truth_source: string;
}

export interface BenchmarkPlace {
  slug: string;
  name: string;
  tier: string;
  country: string;
  n_layers: number;
  total_triangles: number;
  total_mb: number;
  height_mix: HeightMix;
  height_fraction: HeightMix;
  measured_pct: number;
  any_noncommercial: boolean;
  ground_truth?: GroundTruth | null;
}

export interface Benchmark {
  schema_version: number;
  n_places: number;
  global_height_mix: HeightMix;
  global_height_fraction: HeightMix;
  tier_totals_mb: Record<string, number>;
  tier_counts: Record<string, number>;
  total_mb: number;
  per_place: BenchmarkPlace[];
}

// Per-feature attributes carried in each building glTF node's `extras`.
export interface BuildingFeature {
  id: number;
  height_m: number;
  height_source: 'measured' | 'floors' | 'raster' | 'prior';
  class: number | null; // WorldCover land-cover class
  area_m2?: number;
  num_floors?: number | null;
  min_height_m?: number | null;
  use?: string | null; // Overture building class (residential, commercial, industrial, ...)
  subtype?: string | null;
  roof_shape?: string | null;
}
