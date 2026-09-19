import { NextRequest, NextResponse } from 'next/server';
import {
  getCopernicusAuthToken,
  searchCopernicusSentinel2Scenes,
} from '../../../../lib/satellite/copernicusService';

export const dynamic = 'force-dynamic';

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

    const clientId = process.env.COPERNICUS_CLIENT_ID;
    const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;

    // 1. Check if official Copernicus Data Space credentials are configured
    if (clientId && clientSecret) {
      const token = await getCopernicusAuthToken(clientId, clientSecret);
      const scenes = await searchCopernicusSentinel2Scenes(lat, lon, max_cloud_cover, 5);

      if (scenes.length > 0) {
        return NextResponse.json({
          provider: 'Copernicus Data Space Ecosystem (CDSE Official)',
          authenticated: !!token,
          scenes_found: scenes.length,
          latest_scene: scenes[0],
          scenes,
        });
      }
    }

    // 2. Fallback to open AWS Earth Search STAC catalog
    const stacUrl = 'https://earth-search.aws.element84.com/v1/search';
    const stacRes = await fetch(stacUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collections: ['sentinel-2-l2a'],
        intersects: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        query: {
          'eo:cloud_cover': { lte: max_cloud_cover },
        },
        sortby: [{ field: 'properties.datetime', direction: 'desc' }],
        limit: 5,
      }),
    });

    if (stacRes.ok) {
      const stacData = await stacRes.json();
      return NextResponse.json({
        provider: 'Copernicus Sentinel-2 via AWS Earth Search STAC (Open Access)',
        authenticated: false,
        scenes_found: stacData.features?.length || 0,
        latest_scene: stacData.features?.[0] || null,
        features: stacData.features || [],
      });
    }

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
