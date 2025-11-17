import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');
    const monthlyBill = parseFloat(searchParams.get('monthlyBill') || '0');
    const roofSize = parseFloat(searchParams.get('roofSize') || '1000');

    if (!lat || !lon || !monthlyBill) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const nrelApiKey = process.env.NREL_API_KEY;
    if (!nrelApiKey) {
      return NextResponse.json({ error: 'NREL API key not configured' }, { status: 500 });
    }

    // Calculate system size based on monthly bill
    // Assumption: ₹8/kWh electricity rate, 5 hours peak sun
    const electricityRate = 8; // ₹/kWh
    const monthlyConsumption = monthlyBill / electricityRate; // kWh/month
    const dailyConsumption = monthlyConsumption / 30; // kWh/day
    const peakSunHours = 5; // Average for India
    const systemSize = Math.min(
      dailyConsumption / peakSunHours, // Based on consumption
      roofSize / 100 // Based on roof size (100 sq ft per kW)
    );

    // Ensure system size is reasonable (1-10 kW for residential)
    const finalSystemSize = Math.max(1, Math.min(10, systemSize));

    // Standard system parameters
    const moduleType = 1; // Standard
    const losses = 14; // Standard losses %
    const arrayType = 1; // Fixed open rack
    const tilt = Math.abs(lat); // Optimal tilt = latitude
    const azimuth = lat >= 0 ? 180 : 0; // South in N hemisphere

    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?` +
      `api_key=${nrelApiKey}` +
      `&lat=${lat.toFixed(2)}` +
      `&lon=${lon.toFixed(2)}` +
      `&system_capacity=${finalSystemSize.toFixed(1)}` +
      `&module_type=${moduleType}` +
      `&losses=${losses}` +
      `&array_type=${arrayType}` +
      `&tilt=${tilt.toFixed(0)}` +
      `&azimuth=${azimuth}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NREL API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`NREL API errors: ${data.errors.join(', ')}`);
    }

    // Calculate financial metrics
    const annualProduction = data.outputs.ac_annual; // kWh/year
    const annualSavings = annualProduction * electricityRate; // ₹/year
    const systemCost = finalSystemSize * 50000; // ₹50,000 per kW
    const paybackPeriod = systemCost / annualSavings; // years
    const twentyYearSavings = (annualSavings * 20) - systemCost; // Total savings over 20 years

    // Calculate environmental impact
    // 1 kWh solar = 0.82 kg CO2 saved (India grid emission factor)
    const carbonOffset = (annualProduction * 0.82) / 1000; // tons CO2/year
    const treesEquivalent = Math.round(carbonOffset * 40); // 1 tree absorbs ~25 kg CO2/year

    // Get location name
    const location = data.station_info.city || data.station_info.state || 'Your Location';

    return NextResponse.json({
      solarRadiation: data.outputs.solrad_annual,
      annualProduction: annualProduction,
      capacityFactor: data.outputs.capacity_factor,
      systemSize: finalSystemSize,
      annualSavings: Math.round(annualSavings),
      paybackPeriod: paybackPeriod,
      twentyYearSavings: Math.round(twentyYearSavings),
      carbonOffset: carbonOffset,
      treesEquivalent: treesEquivalent,
      location: location,
    });
  } catch (error: any) {
    console.error('Solar analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze solar potential' },
      { status: 500 }
    );
  }
}
