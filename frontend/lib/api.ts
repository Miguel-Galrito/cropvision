import {
  AnalyzeRequest,
  AnalyzeResponse,
  HealthResponse,
  TimeSeriesResponse,
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new ApiError('Failed to verify API health status', res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    return {
      status: 'offline',
      app_name: 'SatHealth Cloud Client',
      version: '1.0.0',
      environment: 'development',
      stac_catalog_status: 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function analyzeVegetation(
  payload: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  // Allow up to 45 seconds for STAC catalog query and AWS S3 COG streaming
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        lat: payload.lat,
        lon: payload.lon,
        max_cloud_cover: payload.max_cloud_cover ?? 20.0,
        buffer_meters: payload.buffer_meters ?? 500.0,
        date_from: payload.date_from,
        date_to: payload.date_to,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorDetail = 'Error occurred while processing satellite data.';
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

    const data = await res.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new ApiError(
        'Request timed out while streaming Sentinel-2 satellite data from AWS S3. Please try again.',
        504
      );
    }
    throw new ApiError(
      err.message || 'Failed connecting to SatHealth satellite analysis backend.',
      500,
      err
    );
  }
}

export async function fetchTimeSeries(
  lat: number,
  lon: number,
  maxCloudCover: number = 30.0,
  limit: number = 5
): Promise<TimeSeriesResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_BASE}/timeseries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        lat,
        lon,
        max_cloud_cover: maxCloudCover,
        limit,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new ApiError('Failed to fetch historical time series', res.status);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    return {
      coordinates: { lat, lon },
      points_count: 0,
      series: [],
    };
  }
}
