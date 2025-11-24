import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { city, state, country } = await request.json();

    const location = `${city || 'your city'}${state ? ', ' + state : ''}, ${country || 'India'}`;

    // Prompt for Gemini to search for installers and subsidies
    const prompt = `You are a solar energy expert helping users find solar panel installation services and government subsidies.

CRITICAL REQUIREMENT: Only provide information for ${country}. Do NOT include any installers, subsidies, or programs from other countries.

User is in ${city}, ${country}.

Search the web for current information about:

1. **Solar Panel Installation Companies in ${city}, ${country}**:
   - Top-rated local solar installers operating in ${city}
   - Their typical service area
   - Estimated cost ranges for residential installations
   - Average customer ratings if available
   
2. **Government Subsidies and Incentives in ${country}**:
   - Current solar panel installation subsidies/rebates
   - Tax credits or deductions for solar installations
   - Net metering policies
   - Financing options or green loans

Format your response as JSON:
{
  "installers": [
    {
      "name": "string (company name)",
      "location": "string (city or region they serve)",
      "rating": "string (e.g., '4.5/5' or 'Highly Rated')",
      "services": "string (brief description of what they offer)"
    }
  ],
  "subsidies": [
    {
      "program": "string (subsidy/program name)",
      "benefit": "string (what you get, e.g., '30% of installation cost')",
      "authority": "string (who provides it, e.g., 'Central Government' or 'State Government')",
      "eligibility": "string (basic eligibility criteria)"
    }
  ],
  "averageCost": "string (typical installation cost range in ${country}, e.g., '₹2-4 lakhs for 3kW system')",
  "averageROI": "string (typical payback period, e.g., '5-7 years')"
}

Requirements:
- Provide 2-4 installers that serve ${city} or nearby areas in ${country}
- Provide 1-3 current government subsidies available in ${country}
- ALL information must be specific to ${country} ONLY
- Do NOT include installers from USA, Germany, or any other country unless the user is in that country
- Be specific about location - mention ${city} when listing installers`;

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
      installers: aiData.installers || [],
      subsidies: aiData.subsidies || [],
      financing: aiData.financing || null,
      location,
    });

  } catch (error: any) {
    console.error('Solar installers error:', error);
    
    // Fallback data
    return NextResponse.json({
      success: true,
      installers: [
        {
          name: "Local Solar Providers",
          rating: "Contact for quotes",
          services: "Installation, maintenance, monitoring",
          contact: "Search online for solar installers in your area"
        }
      ],
      subsidies: [
        {
          scheme_name: "Government Solar Subsidy",
          provider: "Ministry of New and Renewable Energy",
          benefit: "Up to 40% subsidy for residential rooftop solar",
          eligibility: "Homeowners, check local eligibility"
        }
      ],
      financing: {
        available: true,
        options: "Banks and NBFCs offer solar loans with competitive interest rates",
        typical_roi: "5-7 years"
      },
      fallback: true,
    });
  }
}
