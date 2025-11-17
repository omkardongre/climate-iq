import { NextRequest, NextResponse } from 'next/server';
import { getTemperatureAnomaly } from '@/lib/services/temperature-anomaly';

export const runtime = 'edge';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing lat/lon parameters' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `temp:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return NextResponse.json(cached.data);
    }

    console.log(`[Cache MISS] ${cacheKey}`);
    
    // Get temperature anomaly data
    const tempData = await getTemperatureAnomaly(lat, lon);
    
    // Cache the result
    cache.set(cacheKey, {
      data: tempData,
      timestamp: Date.now(),
    });

    return NextResponse.json(tempData);
  } catch (error: any) {
    console.error('Temperature anomaly API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get temperature anomaly' },
      { status: 500 }
    );
  }
}
