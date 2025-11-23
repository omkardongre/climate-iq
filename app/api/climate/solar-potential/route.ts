import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode');
    
    let south, west, north, east;
    
    if (mode === 'point') {
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lon = parseFloat(searchParams.get('lon') || '0');
      const radiusKm = parseFloat(searchParams.get('radius') || '1'); // Default 1km
      
      // Convert radius to approx lat/lon delta
      const latDelta = radiusKm / 111;
      const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
      
      south = lat - latDelta;
      north = lat + latDelta;
      west = lon - lonDelta;
      east = lon + lonDelta;
    } else {
      const bounds = searchParams.get('bounds');
      if (!bounds) {
        return NextResponse.json({ error: 'Bounds or point required' }, { status: 400 });
      }
      [south, west, north, east] = bounds.split(',').map(Number);
    }

    // Generate some mock solar data points within the bounds
    const solarData = [];
    // Adjust density based on area size to avoid too many points
    const latDiff = north - south;
    const lonDiff = east - west;
    // For 1km radius (small area), we want enough points to look good (e.g., 5x5 grid)
    // For large bounds, we want similar density but capped
    
    const steps = mode === 'point' ? 5 : 5; 
    const latStep = latDiff / steps;
    const lonStep = lonDiff / steps;

    for (let lat = south + latStep/2; lat < north; lat += latStep) {
      for (let lon = west + lonStep/2; lon < east; lon += lonStep) {
        // Randomize slightly
        const pointLat = lat + (Math.random() - 0.5) * latStep * 0.5;
        const pointLng = lon + (Math.random() - 0.5) * lonStep * 0.5;
        
        // Mock values based on latitude (closer to equator = better)
        const distFromEquator = Math.abs(pointLat);
        const baseRadiation = 7 - (distFromEquator / 10); // Rough approx
        const solarRadiation = baseRadiation + (Math.random() * 1); // Random variation
        
        solarData.push({
          lat: pointLat,
          lng: pointLng,
          solarRadiation: solarRadiation, // kWh/m2/day
          annualProduction: solarRadiation * 365 * 4 * 0.75, // 4kW system, 75% efficiency
          capacityFactor: (solarRadiation * 365 * 4 * 0.75) / (4 * 24 * 365) * 100
        });
      }
    }

    return NextResponse.json({ solarData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
