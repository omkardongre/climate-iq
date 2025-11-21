import { NextRequest, NextResponse } from 'next/server';
import { getActiveFires, getFiresNearPoint, calculateFireStats, getFireRiskLevel } from '@/lib/services/nasa-firms';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const mode = searchParams.get('mode') || 'bounds'; // 'bounds' or 'point'
    const days = parseInt(searchParams.get('days') || '1');

    if (mode === 'point') {
      // Get fires near a specific point
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lon = parseFloat(searchParams.get('lon') || '0');
      const radius = parseFloat(searchParams.get('radius') || '100');

      if (!lat || !lon) {
        return NextResponse.json(
          { error: 'Latitude and longitude are required for point mode' },
          { status: 400 }
        );
      }

      const fires = await getFiresNearPoint(lat, lon, radius);
      const stats = calculateFireStats(fires);
      const risk = getFireRiskLevel(stats);

      return NextResponse.json({
        fires,
        stats,
        risk,
        mode: 'point',
        center: { lat, lon },
        radius,
      });
    } else {
      // Get fires in bounding box
      const minLon = parseFloat(searchParams.get('minLon') || '0');
      const minLat = parseFloat(searchParams.get('minLat') || '0');
      const maxLon = parseFloat(searchParams.get('maxLon') || '0');
      const maxLat = parseFloat(searchParams.get('maxLat') || '0');

      if (!minLon || !minLat || !maxLon || !maxLat) {
        return NextResponse.json(
          { error: 'Bounding box coordinates are required (minLon, minLat, maxLon, maxLat)' },
          { status: 400 }
        );
      }

      const bounds: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];
      const fires = await getActiveFires(bounds, days);
      const stats = calculateFireStats(fires);
      const risk = getFireRiskLevel(stats);

      return NextResponse.json({
        fires,
        stats,
        risk,
        mode: 'bounds',
        bounds,
      });
    }
  } catch (error: any) {
    console.error('Fire data API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch fire data',
        fires: [],
        stats: {
          totalFires: 0,
          highConfidence: 0,
          averageBrightness: 0,
          totalFirePower: 0,
          lastUpdate: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
