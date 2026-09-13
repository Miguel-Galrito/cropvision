/**
 * TypeScript definitions for CropVision SaaS.
 * Agricultural Earth Observation & Satellite NDVI/SAR Intelligence.
 */

export type VegetationCategory =
  | 'dense_vegetation'
  | 'moderate_vegetation'
  | 'sparse_vegetation'
  | 'bare_soil'
  | 'water_or_inert';

export interface VegetationInterpretation {
  category: VegetationCategory;
  label: string;
  badge_color: string;
  description: string;
  recommendation: string;
}

export interface NDVIStatistics {
  mean: number;
  min: number;
  max: number;
  std: number;
  median: number;
  p25: number;
  p75: number;
}

export interface MultiIndexMetrics {
  ndvi: number; // Normalized Difference Vegetation Index: canopy vigor
  ndre: number; // Normalized Difference Red Edge: chlorophyll & nitrogen uptake
  ndwi: number; // Normalized Difference Water Index: canopy hydration & water stress
  evi: number;  // Enhanced Vegetation Index: high-biomass structural index
  msavi: number; // Modified Soil Adjusted Vegetation Index: minimizes soil background
}

export interface SpectralBand {
  band: string;
  name: string;
  wavelength_nm: number;
  reflectance: number;
  resolution_m: number;
  purpose: string;
}

export interface AgroClimateMetrics {
  evapotranspiration_mm_day: number; // Daily reference ET0
  growing_degree_days: number;       // GDD base 10°C
  solar_radiation_w_m2: number;      // Solar irradiance W/m²
  next_satellite_overpass_hours: number; // Countdown to next pass
  cap_nitrates_compliance_pct: number; // EU Nitrates Directive compliance score
}

export interface SarRadarTelemetry {
  satellite: string; // Sentinel-1A / Sentinel-1C
  mode: string; // IW (Interferometric Wide Swath)
  polarization: string; // VV + VH dual polarization
  backscatter_vv_db: number; // e.g. -11.4 dB
  backscatter_vh_db: number; // e.g. -18.2 dB
  cross_ratio_vh_vv: number; // Biomass index
  soil_moisture_estimate_pct: number; // volumetric soil moisture 0 - 100%
  penetration_status: 'CLOUDS_PENETRATED' | 'ALL_WEATHER_VERIFIED';
  radar_colormap_url?: string;
}

export interface PrescriptionZone {
  zone_id: string;
  name: string;
  target_n_rate_kg_ha: number;
  recommendation: string;
  percentage_of_parcel: number;
  estimated_hectares: number;
  color_hex: string;
}

export interface TractorPrescriptionMap {
  field_name: string;
  total_area_hectares: number;
  fertilizer_savings_eur: number;
  baseline_flat_n_kg: number;
  optimized_variable_n_kg: number;
  nitrogen_saved_kg: number;
  co2_equivalent_mitigated_kg: number;
  isobus_export_ready: boolean;
  selected_fertilizer_name?: string;
  fertilizer_price_eur_ton?: number;
  zones: PrescriptionZone[];
}

export interface AnalyzeRequest {
  lat: number;
  lon: number;
  max_cloud_cover?: number;
  buffer_meters?: number;
  date_from?: string;
  date_to?: string;
  polygon_geojson?: any;
  sensor_mode?: 'sentinel_2_optical' | 'sentinel_1_sar' | 'dual_fusion';
}

export interface AnalyzeResponse {
  success: boolean;
  scene_id: string;
  platform: string;
  acquisition_date: string;
  cloud_cover_percentage: number;
  sun_elevation?: number;
  coordinates: {
    lat: number;
    lon: number;
  };
  bbox: [number, number, number, number];
  resolution_meters: number;
  pixels_analyzed: number;
  ndvi: NDVIStatistics;
  interpretation: VegetationInterpretation;
  thumbnail_url: string;
  true_color_thumbnail?: string | null;
  location_name?: string;
  is_simulated: boolean;
  processing_time_ms: number;
  // Deep-Tech Enterprise Spin-Off Capabilities:
  sar_radar?: SarRadarTelemetry;
  prescription_map?: TractorPrescriptionMap;
  polygon_area_hectares?: number;
  multi_indices?: MultiIndexMetrics;
  spectral_bands?: SpectralBand[];
  climate_metrics?: AgroClimateMetrics;
}

export interface TimeSeriesPoint {
  date: string;
  scene_id: string;
  ndvi_mean: number;
  cloud_cover: number;
  sar_moisture_pct?: number;
}

export interface TimeSeriesResponse {
  coordinates: {
    lat: number;
    lon: number;
  };
  points_count: number;
  series: TimeSeriesPoint[];
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  stac_catalog_status: string;
  timestamp: string;
}

export interface PresetLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  cropType: string;
  lat: number;
  lon: number;
  zoom: number;
  description: string;
  hectares?: number;
  polygon?: number[][];
}
