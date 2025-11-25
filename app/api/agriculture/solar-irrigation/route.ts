import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lon = parseFloat(searchParams.get("lon") || "0");
    const pumpHP = parseFloat(searchParams.get("pumpHP") || "0");
    const hoursPerDay = parseFloat(searchParams.get("hoursPerDay") || "0");
    const monthlyBill = parseFloat(searchParams.get("monthlyBill") || "0");

    if (!lat || !lon || !pumpHP || !hoursPerDay) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const nrelApiKey = process.env.NREL_API_KEY;
    if (!nrelApiKey) {
      return NextResponse.json(
        { error: "NREL API key not configured" },
        { status: 500 }
      );
    }

    // Convert HP to kW (1 HP = 0.746 kW)
    const pumpPowerKW = pumpHP * 0.746;

    // Calculate daily energy consumption
    const dailyConsumption = pumpPowerKW * hoursPerDay; // kWh/day

    // System size should be 1.2-1.5x pump power to account for:
    // - Inverter losses
    // - Panel degradation
    // - Non-peak sun hours
    const systemSize = Math.max(pumpPowerKW * 1.3, 3); // Minimum 3kW system

    // Standard system parameters
    const moduleType = 1; // Standard
    const losses = 14; // Standard losses %
    const arrayType = 1; // Fixed open rack
    const tilt = Math.abs(lat); // Optimal tilt = latitude
    const azimuth = lat >= 0 ? 180 : 0; // South in N hemisphere

    const url =
      `https://developer.nrel.gov/api/pvwatts/v8.json?` +
      `api_key=${nrelApiKey}` +
      `&lat=${lat.toFixed(2)}` +
      `&lon=${lon.toFixed(2)}` +
      `&system_capacity=${systemSize.toFixed(1)}` +
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
      throw new Error(`NREL API errors: ${data.errors.join(", ")}`);
    }

    // Get country for subsidy calculation
    const country = searchParams.get("country") || "India";

    // AI Agent: Search for country-specific solar subsidies
    let subsidyPercent = 0.3; // Default for India (PM-KUSUM)
    let subsidyScheme = "PM-KUSUM scheme";

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.1, // Low temperature for factual data
        },
      });

      const prompt = `You are a solar subsidy research agent. Search for the LATEST government solar irrigation subsidy programs in ${country}.

TASK:
1. Find current (2025) government subsidies for agricultural/farm solar installations
2. Extract the subsidy percentage (e.g., 30%, 40%, etc.)
3. Extract the scheme/program name

Return ONLY a JSON object with this exact format:
{
  "subsidy_percent": 0.30,
  "scheme_name": "Example Scheme Name",
  "notes": "Brief note about eligibility if any"
}

If NO subsidy exists, return: {"subsidy_percent": 0, "scheme_name": "No subsidy available", "notes": ""}

Country: ${country}
Focus: Agricultural/Farm Solar Irrigation Systems
Include: Federal and state-level programs`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response (handles markdown code blocks)
      let jsonStr = text;

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const subsidyData = JSON.parse(jsonMatch[0]);
          if (subsidyData.subsidy_percent && subsidyData.subsidy_percent > 0) {
            subsidyPercent = subsidyData.subsidy_percent;
            subsidyScheme = subsidyData.scheme_name || "Government subsidy";
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          // Will fall through to fallback
        }
      }
    } catch (error) {
      console.error("AI subsidy search error:", error);
      // Fallback to verified 2025 data for known countries
      const knownSubsidies: Record<
        string,
        { percent: number; scheme: string }
      > = {
        India: { percent: 0.3, scheme: "PM-KUSUM (30% Central + 30% State)" },
        "United States": {
          percent: 0.5,
          scheme: "REAP Grant (50%) + ITC (30%)",
        },
        "United States of America": {
          percent: 0.5,
          scheme: "REAP Grant (50%) + ITC (30%)",
        },
        USA: { percent: 0.5, scheme: "REAP Grant (50%) + ITC (30%)" },
        Germany: { percent: 0.2, scheme: "EEG Solarpaket 1 + KfW Loans" },
        Australia: { percent: 0.25, scheme: "Agricultural Solar Rebate" },
        Brazil: { percent: 0.15, scheme: "BNDES Green Credit Line" },
        China: { percent: 0.3, scheme: "National Solar Subsidy" },
        Japan: { percent: 0.2, scheme: "FIT Program" },
      };
      if (knownSubsidies[country]) {
        subsidyPercent = knownSubsidies[country].percent;
        subsidyScheme = knownSubsidies[country].scheme;
      }
    }

    // Calculate financial metrics
    const annualProduction = data.outputs.ac_annual; // kWh/year

    // Agricultural electricity rate in India (subsidized)
    const electricityRate = 5; // ₹/kWh (agricultural rate)

    // Calculate annual consumption and savings
    const annualConsumption = dailyConsumption * 365; // kWh/year
    const annualSavings =
      Math.min(annualProduction, annualConsumption) * electricityRate; // ₹/year

    // System cost (agricultural solar is slightly more expensive due to remote installation)
    const systemCostPerKW = 60000; // ₹/kW
    const systemCost = systemSize * systemCostPerKW;

    // Apply AI-discovered subsidy
    const subsidyAmount = systemCost * subsidyPercent;
    const netCost = systemCost - subsidyAmount;

    // Payback period
    const paybackPeriod = netCost / annualSavings; // years

    // 20-year savings
    const twentyYearSavings = annualSavings * 20 - netCost;

    // Environmental impact
    // 1 kWh solar = 0.82 kg CO2 saved (India grid emission factor)
    const carbonOffset =
      (Math.min(annualProduction, annualConsumption) * 0.82) / 1000; // tons CO2/year

    // Get location name
    const location =
      data.station_info.city || data.station_info.state || "Your Location";

    return NextResponse.json({
      solarRadiation: data.outputs.solrad_annual,
      systemSize: systemSize,
      annualProduction: annualProduction,
      pumpPower: pumpPowerKW,
      dailyRunHours: hoursPerDay,
      annualSavings: Math.round(annualSavings),
      paybackPeriod: paybackPeriod,
      systemCost: Math.round(systemCost),
      subsidyAmount: Math.round(subsidyAmount),
      subsidyPercent: Math.round(subsidyPercent * 100),
      subsidyScheme: subsidyScheme,
      netCost: Math.round(netCost),
      twentyYearSavings: Math.round(twentyYearSavings),
      carbonOffset: carbonOffset,
      location: location,
      country: country,
    });
  } catch (error: any) {
    console.error("Solar irrigation analysis API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze solar irrigation potential",
      },
      { status: 500 }
    );
  }
}
