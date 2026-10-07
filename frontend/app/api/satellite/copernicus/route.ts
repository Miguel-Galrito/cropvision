import { NextRequest, NextResponse } from 'next/server';
import {
  getCopernicusAuthToken,
  searchCopernicusSentinel2Scenes,
} from '../../../../lib/satellite/copernicusService';

export const dynamic = 'force-dynamic';

// The official CDSE catalogue often takes 10s+; the open STAC mirror of the same
// Sentinel-2 L2A archive answers in ~1s. Query both and only wait this long for CDSE.
const CDSE_BUDGET_MS = 2500;

async function searchOpenStac(lat: number, lon: number, maxCloudCover: number) {
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://earth-search.aws.element84.com/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        collections: ['sentinel-2-l2a'],
        intersects: { type: 'Point', coordinates: [lon, lat] },
        datetime: `${since}/..`,
        query: { 'eo:cloud_cover': { lte: maxCloudCover } },
        sortby: [{ field: 'properties.datetime', direction: 'desc' }],
        limit: 5,
      }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchCdse(lat: number, lon: number, maxCloudCover: number) {
  const clientId = process.env.COPERNICUS_CLIENT_ID;
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const token = await getCopernicusAuthToken(clientId, clientSecret);
  const scenes = await searchCopernicusSentinel2Scenes(lat, lon, maxCloudCover, 5);
  if (scenes.length === 0) return null;

  return {
    provider: 'Copernicus Data Space Ecosystem (CDSE Official)',
    authenticated: !!token,
    scenes_found: scenes.length,
    latest_scene: scenes[0],
    scenes,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lon, max_cloud_cover = 30.0 } = body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and Longitude must be valid numbers' },
        { status: 400 }
      );
    }

    const cdsePromise = searchCdse(lat, lon, max_cloud_cover).catch(() => null);
    const stacPromise = searchOpenStac(lat, lon, max_cloud_cover);

    // 1. Prefer the official Copernicus Data Space result if it arrives within budget
    const cdse = await Promise.race([
      cdsePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), CDSE_BUDGET_MS)),
    ]);
    if (cdse) return NextResponse.json(cdse);

    // 2. Otherwise use the open AWS Earth Search STAC catalog (same Sentinel-2 L2A data)
    const stacData = await stacPromise;
    if (stacData) {
      return NextResponse.json({
        provider: 'Copernicus Sentinel-2 via AWS Earth Search STAC (Open Access)',
        authenticated: false,
        scenes_found: stacData.features?.length || 0,
        latest_scene: stacData.features?.[0] || null,
        features: stacData.features || [],
      });
    }

    // 3. STAC failed too: give CDSE the rest of its own timeout
    const lateCdse = await cdsePromise;
    if (lateCdse) return NextResponse.json(lateCdse);

    return NextResponse.json(
      { error: 'Could not fetch satellite scenes from Copernicus catalogs' },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('[Copernicus API Route] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
