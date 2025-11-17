import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

interface RecommendationInput {
  farmSize: number;
  cropType: string;
  emissions: {
    monthly: number;
    annual: number;
    perAcre: number;
  };
  breakdown: {
    fuel: number;
    electricity: number;
    fertilizer: number;
    livestock: number;
    irrigation: number;
  };
  quickWins: Array<{
    category: string;
    currentEmissions: number;
    potentialReduction: number;
    percentage: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const data: RecommendationInput = await request.json();
    
    let recommendations = [];
    
    // Try to get AI recommendations
    try {
      // Build context for Gemini
      const context = `
Farm Carbon Footprint Analysis:

Farm Details:
- Size: ${data.farmSize} acres
- Crop Type: ${data.cropType}
- Annual Emissions: ${data.emissions.annual} kg CO2e
- Per Acre Emissions: ${data.emissions.perAcre} kg CO2e/acre

Emissions Breakdown:
- Fuel: ${(data.breakdown.fuel || 0).toFixed(1)}%
- Electricity: ${(data.breakdown.electricity || 0).toFixed(1)}%
- Fertilizer: ${(data.breakdown.fertilizer || 0).toFixed(1)}%
- Livestock: ${(data.breakdown.livestock || 0).toFixed(1)}%
- Irrigation: ${(data.breakdown.irrigation || 0).toFixed(1)}%

Top Reduction Opportunities:
${data.quickWins.map((win, i) => `${i + 1}. ${win.category}: ${win.currentEmissions} kg CO2e/month (${win.percentage}% reduction potential)`).join('\n')}

Provide 5 specific, actionable recommendations to reduce carbon emissions on this farm.
Focus on:
1. Practical changes the farmer can implement immediately
2. Cost-effective solutions
3. Sustainable farming practices
4. Technology adoption (if applicable)
5. Long-term strategies

Format as JSON array of objects with:
- title: Short recommendation title
- description: Detailed explanation (2-3 sentences)
- impact: Expected CO2e reduction (kg/year)
- cost: Implementation cost (Low/Medium/High)
- timeframe: When to implement (Immediate/Short-term/Long-term)

Example:
[
  {
    "title": "Switch to Solar-Powered Irrigation",
    "description": "Replace diesel pumps with solar-powered irrigation systems. This eliminates fuel costs and significantly reduces emissions from irrigation.",
    "impact": 1200,
    "cost": "High",
    "timeframe": "Long-term"
  }
]

Return ONLY the JSON array, no other text.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(context);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          recommendations = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log('Failed to parse Gemini response, using fallback');
        }
      }
    } catch (aiError: any) {
      console.error('Gemini API error:', aiError.message);
      // Return error instead of fallback dummy data
      return NextResponse.json(
        { 
          error: 'AI recommendations unavailable',
          message: aiError.message || 'Failed to connect to Gemini AI. Please check your API key.',
          recommendations: [],
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // If AI returned empty results
    if (recommendations.length === 0) {
      return NextResponse.json(
        { 
          error: 'No recommendations generated',
          message: 'Gemini AI did not return any recommendations. Please try again.',
          recommendations: [],
        },
        { status: 500 }
      );
    }
    
    // Calculate total potential reduction
    const totalReduction = recommendations.reduce((sum: number, rec: any) => sum + (rec.impact || 0), 0);
    const reductionPercentage = (totalReduction / data.emissions.annual) * 100;
    
    return NextResponse.json({
      recommendations,
      summary: {
        totalPotentialReduction: totalReduction,
        reductionPercentage: parseFloat(reductionPercentage.toFixed(1)),
        newAnnualEmissions: data.emissions.annual - totalReduction,
      },
    });
    
  } catch (error: any) {
    console.error('Carbon recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
