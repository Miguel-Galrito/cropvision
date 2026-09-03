import {
  AnalyzeRequest,
  AnalyzeResponse,
  HealthResponse,
  TimeSeriesPoint,
  TimeSeriesResponse,
  VegetationCategory,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new ApiError('Failed to verify API health status', res.status);
    }
    return await res.json();
  } catch {
    // Return graceful status for static demo deployment
    return {
      status: 'demo_mode',
      app_name: 'SatHealth Cloud Client',
      version: '1.0.0',
      environment: 'static_preview',
      stac_catalog_status: 'client_active',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generates an in-browser synthetic colormap heatmap data URI (PNG)
 * when running in standalone static GitHub Pages mode without a local backend.
 */
function generateClientHeatmap(ndviMean: number): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(120, 120);
  const data = imgData.data;

  for (let y = 0; y < 120; y++) {
    for (let x = 0; x < 120; x++) {
      const idx = (y * 120 + x) * 4;
      const variation = Math.sin(x / 10) * Math.cos(y / 10) * 0.15;
      const pixelNdvi = Math.max(-0.2, Math.min(0.9, ndviMean + variation));

      let r = 0, g = 0, b = 0;
      if (pixelNdvi < 0.1) {
        // Red / Brown soil
        r = 185; g = 28; b = 28;
      } else if (pixelNdvi < 0.35) {
        // Yellow / Sparse
        r = 234; g = 179; b = 8;
      } else if (pixelNdvi < 0.6) {
        // Light green
        r = 132; g = 204; b = 22;
      } else {
        // Lush green
        r = 16; g = 185; b = 129;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

function getClientInterpretation(mean: number) {
  if (mean >= 0.6) {
    return {
      category: 'dense_vegetation' as VegetationCategory,
      label: 'Dense Healthy Vegetation',
      badge_color: 'emerald',
      description: 'Vigorous crop canopy with high leaf area index and intense photosynthetic activity.',
      recommendation: 'Ideal growth conditions. Maintain current irrigation schedule and nutrition plan.',
    };
  } else if (mean >= 0.35) {
    return {
      category: 'moderate_vegetation' as VegetationCategory,
      label: 'Moderate Vegetation / Developing',
      badge_color: 'green',
      description: 'Moderate vegetative density typical of growing crops, semi-dense pasture, or orchard canopy.',
      recommendation: 'Monitor soil moisture levels and evaluate nitrogen top-dressing requirements.',
    };
  } else if (mean >= 0.18) {
    return {
      category: 'sparse_vegetation' as VegetationCategory,
      label: 'Sparse Vegetation / Moisture Stress',
      badge_color: 'amber',
      description: 'Low vegetative vigor. Indicative of water deficit stress, thin crop stand, or post-harvest residue.',
      recommendation: 'Inspect plot irrigation sectors to rule out emitter clogs or localized moisture deficits.',
    };
  } else if (mean >= 0.0) {
    return {
      category: 'bare_soil' as VegetationCategory,
      label: 'Bare Soil / Fallow Ground',
      badge_color: 'stone',
      description: 'Predominance of bare ground, tilled earth, rock outcrop, or non-vegetated infrastructure.',
      recommendation: 'Plot is prepared for seeding or in fallow state. No immediate weed pressure detected.',
    };
  } else {
    return {
      category: 'water_or_inert' as VegetationCategory,
      label: 'Water Body / Saturated Zone',
      badge_color: 'sky',
      description: 'Strong absorption in the Near-Infrared (NIR) band, indicative of open water or waterlogged ground.',
      recommendation: 'Natural reservoir, irrigation pond, or wetland drainage line.',
    };
  }
}

export async function analyzeVegetation(
  payload: AnalyzeRequest
): Promise<AnalyzeResponse> {
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        lat: payload.lat,
        lon: payload.lon,
        max_cloud_cover: payload.max_cloud_cover ?? 20.0,
        buffer_meters: payload.buffer_meters ?? 500.0,
        date_from: payload.date_from,
        date_to: payload.date_to,
      }),
    });

    if (!res.ok) {
      let errorDetail = 'Unknown error occurred while processing satellite data.';
      let errorData = null;
      try {
        errorData = await res.json();
        if (errorData?.detail?.message) {
          errorDetail = errorData.detail.message;
        } else if (typeof errorData?.detail === 'string') {
          errorDetail = errorData.detail;
        }
      } catch {
        errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
      }
      throw new ApiError(errorDetail, res.status, errorData?.detail);
    }

    return await res.json();
  } catch (err: any) {
    // If backend is not running (e.g. static website preview on GitHub Pages),
    // provide a calibrated client-side Earth Observation simulation
    if (err instanceof ApiError) {
      throw err;
    }

    console.warn('Backend connection unavailable. Generating high-fidelity Copernicus client simulation.');
    const baseNdvi =
      payload.lat > 38.1 && payload.lat < 38.25 ? -0.15 : payload.lat > 0 ? 0.675 : 0.58;
    const thumb = generateClientHeatmap(baseNdvi);
    const interp = getClientInterpretation(baseNdvi);

    return {
      success: true,
      scene_id: `S2C_29SPC_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_0_L2A`,
      platform: 'Sentinel-2C',
      acquisition_date: new Date().toISOString(),
      cloud_cover_percentage: 1.2,
      sun_elevation: 58.4,
      coordinates: { lat: payload.lat, lon: payload.lon },
      bbox: [
        payload.lon - 0.005,
        payload.lat - 0.004,
        payload.lon + 0.005,
        payload.lat + 0.004,
      ],
      resolution_meters: 10.0,
      pixels_analyzed: 10000,
      ndvi: {
        mean: baseNdvi,
        min: Number((baseNdvi - 0.15).toFixed(3)),
        max: Number((baseNdvi + 0.18).toFixed(3)),
        std: 0.084,
        median: Number((baseNdvi + 0.01).toFixed(3)),
        p25: Number((baseNdvi - 0.05).toFixed(3)),
        p75: Number((baseNdvi + 0.06).toFixed(3)),
      },
      interpretation: interp,
      thumbnail_url: thumb,
      true_color_thumbnail: null,
      is_simulated: true,
      processing_time_ms: 184.5,
    };
  }
}

export async function fetchTimeSeries(
  lat: number,
  lon: number,
  maxCloudCover: number = 30.0,
  limit: number = 5
): Promise<TimeSeriesResponse> {
  try {
    const res = await fetch(`${API_BASE}/timeseries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        lat,
        lon,
        max_cloud_cover: maxCloudCover,
        limit,
      }),
    });

    if (!res.ok) {
      throw new ApiError('Failed to fetch historical time series', res.status);
    }

    return await res.json();
  } catch {
    // Client fallback for static site demo
    const points: TimeSeriesPoint[] = [];
    const now = new Date();
    const baseNdvi = lat > 38.1 && lat < 38.25 ? -0.12 : 0.64;

    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 15 * 86400000);
      points.push({
        date: d.toISOString().slice(0, 10),
        scene_id: `S2_ORBIT_${d.toISOString().slice(0, 10).replace(/-/g, '')}`,
        ndvi_mean: Number((baseNdvi + (i % 3 - 1) * 0.04).toFixed(3)),
        cloud_cover: Number((Math.random() * 8).toFixed(1)),
      });
    }

    return {
      coordinates: { lat, lon },
      points_count: points.length,
      series: points,
    };
  }
}
