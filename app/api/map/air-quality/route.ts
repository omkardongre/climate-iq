import { NextRequest, NextResponse } from 'next/server';
import { getAirQuality, getAirQualityRegion } from '@/lib/services/copernicus';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'point';

    if (mode === 'point') {
      // Get air quality for a specific point
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lon = parseFloat(searchParams.get('lon') || '0');

      if (!lat || !lon) {
        return NextResponse.json(
          { error: 'Missing latitude or longitude' },
          { status: 400 }
        );
      }

      const data = await getAirQuality(lat, lon);
      return NextResponse.json(data);

    } else if (mode === 'region') {
      // Get air quality grid for a region
      const minLat = parseFloat(searchParams.get('minLat') || '0');
      const minLon = parseFloat(searchParams.get('minLon') || '0');
      const maxLat = parseFloat(searchParams.get('maxLat') || '0');
      const maxLon = parseFloat(searchParams.get('maxLon') || '0');
      const gridSize = parseInt(searchParams.get('gridSize') || '5');

      if (!minLat || !minLon || !maxLat || !maxLon) {
        return NextResponse.json(
          { error: 'Missing bounding box parameters' },
          { status: 400 }
        );
      }

      const data = await getAirQualityRegion(minLat, minLon, maxLat, maxLon, gridSize);
      return NextResponse.json(data);

    } else {
      return NextResponse.json(
        { error: 'Invalid mode. Use "point" or "region"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Air quality API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch air quality data' },
      { status: 500 }
    );
  }
}
