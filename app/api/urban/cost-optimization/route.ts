import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { city, country, electricityUsage, waterUsage } = await request.json();

    const location = `${city || 'your city'}, ${country || 'India'}`;

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
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }

    const aiData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      recommendations: aiData.recommendations || [],
      location,
    });

  } catch (error: any) {
    console.error('Cost optimization error:', error);
    
    // Fallback recommendations
    return NextResponse.json({
      success: true,
      recommendations: [
        {
          title: "Switch to Time-of-Use Tariff",
          savings: "₹300-500/month",
          action: "Contact your utility provider to enroll in off-peak hour pricing. Run heavy appliances (washing machine, dishwasher) during off-peak hours (typically 10 PM - 6 AM).",
          category: "tariff"
        },
        {
          title: "Install LED Bulbs",
          savings: "₹200/month",
          action: "Replace all traditional incandescent and CFL bulbs with LED bulbs. LEDs use 75% less energy and last 25x longer.",
          category: "appliance"
        },
        {
          title: "Optimize AC Usage",
          savings: "₹800/month",
          action: "Set AC to 24-25°C instead of 18-20°C. Use ceiling fans with AC to feel cooler at higher temperatures. Clean AC filters monthly for better efficiency.",
          category: "behavior"
        },
        {
          title: "Fix Water Leaks",
          savings: "₹150/month",
          action: "Check all taps, pipes, and toilets for leaks. A dripping tap can waste 15 liters/day. Repair leaks immediately to save water and money.",
          category: "rebate"
        }
      ],
      fallback: true,
    });
  }
}
