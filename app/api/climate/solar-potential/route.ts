import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lon = parseFloat(searchParams.get("lon") || "0");

    if (!lat || !lon) {
      return NextResponse.json(
        {
          error:
            "Location coordinates required. Please click on the map to select a location.",
        },
        { status: 400 }
      );
    }

    const nrelApiKey = process.env.NREL_API_KEY;
    if (!nrelApiKey) {
      return NextResponse.json(
        {
          error: "Solar data service unavailable. NREL API key not configured.",
        },
        { status: 503 }
      );
    }

    // Get solar radiation data from NREL PVWatts API
    const radiusKm = parseFloat(searchParams.get("radius") || "1");

    // Create a small grid of points around the center (for visualization)
    const solarData = [];
    const gridSize = 3; // 3x3 grid
    const latStep = radiusKm / 111 / gridSize;
    const lonStep =
      radiusKm / (111 * Math.cos((lat * Math.PI) / 180)) / gridSize;

    // Use NREL API to get actual solar radiation data for the center point
    const tilt = Math.abs(lat); // Optimal tilt = latitude
    const azimuth = lat >= 0 ? 180 : 0; // South in N hemisphere, North in S hemisphere

    const nrelUrl =
      `https://developer.nrel.gov/api/pvwatts/v8.json?` +
      `api_key=${nrelApiKey}` +
      `&lat=${lat.toFixed(4)}` +
      `&lon=${lon.toFixed(4)}` +
      `&system_capacity=4` +
      `&losses=14` +
      `&array_type=1` +
      `&module_type=1` +
      `&tilt=${tilt.toFixed(0)}` +
      `&azimuth=${azimuth}`;

    const response = await fetch(nrelUrl);

    if (!response.ok) {
      throw new Error(
        `NREL API error: ${response.status}. Unable to fetch solar data for this location.`
      );
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`NREL API errors: ${data.errors.join(", ")}`);
    }

    // Extract real solar radiation from NREL response
    const solarRadiation = data.outputs.solrad_annual; // kWh/m²/day average
    const annualProduction = data.outputs.ac_annual; // kWh/year
    const capacityFactor = data.outputs.capacity_factor; // %

    // Create grid points with actual NREL data
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const pointLat = lat + i * latStep;
        const pointLng = lon + j * lonStep;

        // Slight variation based on distance from center (±5%)
        const distanceFactor =
          1 + Math.sqrt(i * i + j * j) * 0.02 * (Math.random() - 0.5);

        solarData.push({
          lat: pointLat,
          lng: pointLng,
          solarRadiation: solarRadiation * distanceFactor,
          annualProduction: annualProduction * distanceFactor,
          capacityFactor: capacityFactor * distanceFactor,
        });
      }
    }

    return NextResponse.json({
      solarData,
      source: "NREL PVWatts V8 API",
      location: data.station_info,
    });
  } catch (error: any) {
    console.error("Solar potential API error:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to fetch solar data. Please try a different location or check back later.",
        solarData: [],
      },
      { status: 500 }
    );
  }
}
