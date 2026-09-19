import { NextRequest, NextResponse } from 'next/server';
import { fetchSpectralBandsForGeometry } from '@/lib/satellite/spectralEngine';
import { fetchAgroClimate } from '@/lib/weather/openMeteo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lon, polygon, date } = body;

    if (lat === undefined || lon === undefined) {
      return NextResponse.json({ error: 'Missing lat or lon coordinates' }, { status: 400 });
    }

    const [satelliteData, agroClimate] = await Promise.all([
      fetchSpectralBandsForGeometry(Number(lat), Number(lon), polygon, date),
      fetchAgroClimate(Number(lat), Number(lon)).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...satelliteData,
        agroClimate,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error processing satellite telemetry' },
      { status: 500 }
    );
  }
}
