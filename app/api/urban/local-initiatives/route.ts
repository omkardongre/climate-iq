import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { city, country } = await request.json();

    const cityName = city || 'your city';
    const countryName = country || 'India';

    // Multi-agentic prompt: First city-specific, then country-level
    const prompt = `You are an eco-advisor helping residents find local green initiatives and sustainable programs.

IMPORTANT: Only provide information for ${countryName}. Do NOT mix programs from different countries.

Search the web for current green programs and sustainable initiatives in ${countryName}, focusing on ${cityName}.

**Task:** Provide TWO types of initiatives:

1. **City-Specific Initiatives (1-3 results)**: Programs specifically available in ${cityName}
   - Local public transport (metro lines, bus routes, bike-sharing specific to ${cityName})
   - City-run composting or recycling programs
   - Local environmental events or workshops happening in ${cityName}
   
2. **Country-Level Programs (1-3 results)**: National programs available across ${countryName}
   - Government subsidies for solar panels, electric vehicles, etc.
   - National sustainable transport initiatives
   - Green spaces or urban farming programs

Format your response as JSON:
{
  "initiatives": [
    {
      "title": "string (initiative name)",
      "category": "string (transport/waste/energy/community/other)",
      "description": "string (what it is and how to participate)",
      "actionable": "string (specific action user can take)",
      "link": "string (URL if available, or 'Contact local municipality')",
      "scope": "city" or "country"
    }
  ]
}

Requirements:
- Provide 2-6 total initiatives (1-3 city + 1-3 country)
- Clearly label each with scope: "city" or "country"
- City initiatives should be first in the array
- ALL initiatives must be from ${countryName} ONLY
- Do NOT include programs from USA, Germany, or any other country unless ${countryName} is that country
- Make titles clear and specific (e.g., "Mumbai Metro Green Pass" not just "Green Pass")`;

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
      initiatives: aiData.initiatives || [],
      location: `${cityName}, ${countryName}`,
    });

  } catch (error: any) {
    console.error('Local initiatives error:', error);
    
    // Fallback initiatives - generic but useful
    const { city, country } = await request.json();
    const countryName = country || 'India';
    
    return NextResponse.json({
      success: true,
      initiatives: [
        {
          title: "Use Public Transportation",
          category: "transport",
          description: `Reduce your carbon footprint by using buses, metros, or trains in ${city || 'your city'} for daily commute.`,
          actionable: "Check your local transport app for eco-friendly routes",
          link: "Contact local municipality",
          scope: "city"
        },
        {
          title: "Start Composting at Home",
          category: "waste",
          description: "Turn organic waste into nutrient-rich compost for plants.",
          actionable: "Set up a small compost bin in your kitchen or balcony",
          link: "Contact local municipality",
          scope: "city"
        },
        {
          title: "Join Community Clean-up Drives",
          category: "community",
          description: `Participate in local environmental clean-up events in ${city || 'your area'}.`,
          actionable: "Search for 'clean-up events near me' or check community boards",
          link: "Contact local municipality",
          scope: "city"
        },
        {
          title: "Switch to LED Bulbs",
          category: "energy",
          description: "Replace traditional bulbs with energy-efficient LEDs.",
          actionable: "Visit local hardware store and replace old bulbs gradually",
          link: "Contact local municipality",
          scope: "country"
        }
      ],
      fallback: true,
      location: `${city || 'your city'}, ${countryName}`,
    });
  }
}
