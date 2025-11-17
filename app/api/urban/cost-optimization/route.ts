import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { city, country, electricityUsage, waterUsage } =
      await request.json();

    const location = `${city || "your city"}, ${country || "India"}`;

    // Prompt for Gemini to search for cost optimization tips
    const prompt = `You are a home energy efficiency expert helping users reduce utility costs.

User is in ${location} with:
- Electricity usage: ${electricityUsage} kWh/month
- Water usage: ${waterUsage} liters/month

Search the web for current information about:
1. Electricity tariff plans and time-of-use rates in ${location}
2. Water conservation rebates or programs
3. Smart meter installation programs
4. Energy efficiency subsidies or tax credits
5. Best practices for reducing electricity consumption in this region

Format your response as JSON:
{
  "recommendations": [
    {
      "title": "string (recommendation name)",
      "savings": "string (estimated savings, e.g., '₹500/month' or '15%')",
      "action": "string (specific action to take)",
      "category": "string (tariff/rebate/appliance/behavior)"
    }
  ]
}

Provide 3-5 actionable, location-specific recommendations. If specific data for ${location} is not found, provide general energy-saving tips.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }

    const aiData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      recommendations: aiData.recommendations || [],
      location,
    });
  } catch (error: any) {
    console.error("Cost optimization error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to fetch cost optimization recommendations at this time. Please try again later or consult your local utility provider for energy-saving programs and tariff options.",
        recommendations: [],
      },
      { status: 500 }
    );
  }
}
