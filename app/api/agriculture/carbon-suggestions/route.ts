import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { country, cropType, diesel, cattle, carbonData } =
      await request.json();

    // Build farm profile for AI
    const farmProfile = `
Farm Location: ${country || "Not specified"}
Crop: ${cropType}
Current Monthly Emissions: ${carbonData.emissions.monthly.toFixed(0)} kg CO2e
Annual Emissions: ${carbonData.emissions.annual.toFixed(0)} kg CO2e

Emission Sources:
- Fuel: ${carbonData.breakdown.fuel.toFixed(0)} kg CO2e (${(
      (carbonData.breakdown.fuel / carbonData.emissions.monthly) *
      100
    ).toFixed(1)}%)
- Electricity: ${carbonData.breakdown.electricity.toFixed(0)} kg CO2e (${(
      (carbonData.breakdown.electricity / carbonData.emissions.monthly) *
      100
    ).toFixed(1)}%)
- Fertilizer: ${carbonData.breakdown.fertilizer.toFixed(0)} kg CO2e (${(
      (carbonData.breakdown.fertilizer / carbonData.emissions.monthly) *
      100
    ).toFixed(1)}%)
- Livestock: ${carbonData.breakdown.livestock.toFixed(0)} kg CO2e (${(
      (carbonData.breakdown.livestock / carbonData.emissions.monthly) *
      100
    ).toFixed(1)}%)
- Irrigation: ${carbonData.breakdown.irrigation.toFixed(0)} kg CO2e (${(
      (carbonData.breakdown.irrigation / carbonData.emissions.monthly) *
      100
    ).toFixed(1)}%)

Farm Rating: ${carbonData.comparison.rating}
Benchmark Comparison: ${
      carbonData.comparison.difference > 0 ? "Above" : "Below"
    } average by ${Math.abs(carbonData.comparison.difference).toFixed(
      0
    )} kg CO2e
`;

    // Prompt for Gemini AI agent
    const prompt = `You are an agricultural carbon reduction expert. Analyze this farm's carbon footprint and provide actionable recommendations.

${farmProfile}

Please search the web for:
1. SPECIFIC carbon reduction strategies for ${cropType} farms in ${
      country || "this region"
    }
2. CURRENT government carbon credit programs and schemes available in ${
      country || "general"
    }
3. AVERAGE carbon footprint data for similar ${cropType} farms to benchmark performance

Provide your response as JSON:
{
  "reduction_tips": [
    {
      "title": "string (actionable title)",
      "description": "string (detailed explanation)",
      "impact": number (estimated kg CO2e reduction per month),
      "cost": "string (e.g., 'Low', 'Medium', 'High', or specific amount)",
      "timeframe": "string (e.g., 'Immediate', '1-3 months', '6-12 months')"
    }
  ],
  "carbon_schemes": [
    {
      "name": "string (scheme/program name)",
      "country": "string",
      "eligibility": "string",
      "benefit": "string (what farmer gets)"
    }
  ],
  "benchmark": {
    "average_emissions": number (typical monthly emissions for similar farm),
    "your_percentage": number (your emissions as % of average),
    "message": "string (encouraging message)"
  }
}

Provide 3-5 specific, practical tips based on the farm's highest emission sources. Make sure all data is current and relevant for ${
      country || "the region"
    }.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }

    const aiData = JSON.parse(jsonMatch[0]);

    // Format for UI
    const recommendations = aiData.reduction_tips.map((tip: any) => ({
      title: tip.title,
      description: tip.description,
      impact: tip.impact || 0,
      cost: tip.cost,
      timeframe: tip.timeframe,
    }));

    return NextResponse.json({
      success: true,
      recommendations,
      carbon_schemes: aiData.carbon_schemes || [],
      benchmark: aiData.benchmark || null,
    });
  } catch (error: any) {
    console.error("Carbon recommendations error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to fetch carbon reduction recommendations at this time. Please try again later or consult your local agricultural extension office for sustainable farming practices.",
        recommendations: [],
        carbon_schemes: [],
        benchmark: null,
      },
      { status: 500 }
    );
  }
}
