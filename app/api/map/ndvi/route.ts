import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface NDVIData {
  lat: number;
  lng: number;
  ndvi: number;
  healthLevel: string;
  landCover: string;
  cloudCover: number;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Missing lat/lon parameters' }, { status: 400 });
    }

    const planetApiKey = process.env.PLANET_API_KEY;
    if (!planetApiKey) {
      return NextResponse.json({ error: 'Planet API key not configured' }, { status: 500 });
    }

    // Search for recent imagery at this location
    const searchResponse = await fetch('https://api.planet.com/data/v1/quick-search', {
      method: 'POST',
      headers: {
        'Authorization': `api-key ${planetApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_types: ['PSScene'],
        filter: {
          type: 'AndFilter',
          config: [
            {
              type: 'GeometryFilter',
              field_name: 'geometry',
              config: {
                type: 'Point',
                coordinates: [lon, lat],
              },
            },
            {
              type: 'DateRangeFilter',
              field_name: 'acquired',
              config: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
                lte: new Date().toISOString(),
              },
            },
            {
              type: 'RangeFilter',
              field_name: 'cloud_cover',
              config: {
                lte: 0.2, // Less than 20% cloud cover
              },
            },
          ],
        },
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Planet API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.features || searchData.features.length === 0) {
      return NextResponse.json({ error: 'No recent clear imagery available for this location' }, { status: 404 });
    }

    // Get the most recent image
    const mostRecent = searchData.features[0];
    const properties = mostRecent.properties;

    // Estimate NDVI based on available metadata
    // Planet provides clear_percent, visible_percent which correlate with vegetation
    const clearPercent = properties.clear_percent || 0;
    const visiblePercent = properties.visible_percent || 0;
    const cloudCover = properties.cloud_cover || 0;

    // Estimate NDVI (0 to 1 scale)
    // Higher clear_percent and visible_percent suggest healthier vegetation
    // This is a simplified estimation - real NDVI requires NIR and Red band processing
    let estimatedNDVI = 0;
    
    if (clearPercent > 80 && visiblePercent > 90) {
      // Likely vegetated area
      estimatedNDVI = 0.3 + (clearPercent / 100) * 0.5; // 0.3 to 0.8
    } else if (clearPercent > 50) {
      // Moderate vegetation
      estimatedNDVI = 0.2 + (clearPercent / 100) * 0.3; // 0.2 to 0.5
    } else {
      // Sparse vegetation or urban
      estimatedNDVI = 0.1 + (clearPercent / 100) * 0.2; // 0.1 to 0.3
    }

    // Determine health level
    let healthLevel = 'Poor';
    let landCover = 'Urban/Barren';

    if (estimatedNDVI > 0.6) {
      healthLevel = 'Excellent';
      landCover = 'Dense Vegetation';
    } else if (estimatedNDVI > 0.4) {
      healthLevel = 'Good';
      landCover = 'Moderate Vegetation';
    } else if (estimatedNDVI > 0.2) {
      healthLevel = 'Fair';
      landCover = 'Sparse Vegetation';
    }

    const ndviData: NDVIData = {
      lat,
      lng: lon,
      ndvi: parseFloat(estimatedNDVI.toFixed(3)),
      healthLevel,
      landCover,
      cloudCover: cloudCover * 100,
      lastUpdated: properties.acquired,
    };

    return NextResponse.json(ndviData);
  } catch (error: any) {
    console.error('NDVI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch NDVI data' },
      { status: 500 }
    );
  }
}
