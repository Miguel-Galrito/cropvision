/**
 * TypeScript definitions for SatHealth EO SaaS.
 * Exactly matches backend Pydantic schemas.
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

export interface AnalyzeRequest {
  lat: number;
  lon: number;
  max_cloud_cover?: number;
  buffer_meters?: number;
  date_from?: string;
  date_to?: string;
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
}

export interface TimeSeriesPoint {
  date: string;
  scene_id: string;
  ndvi_mean: number;
  cloud_cover: number;
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
}
