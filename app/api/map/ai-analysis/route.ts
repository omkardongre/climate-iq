import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface RegionData {
  fires?: any;
  airQuality?: any;
  waterStress?: any;
  ndvi?: any;
  solar?: any;
  flood?: any;
  temperature?: any;
  activeLayer?: string;
  location: {
    lat: number;
    lon: number;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const data: RegionData = await request.json();

    // Build context for Gemini based on active layer
    const contextParts = [];
    const activeLayer = data.activeLayer || 'general';
    
    contextParts.push(`Location: Latitude ${data.location.lat.toFixed(2)}, Longitude ${data.location.lon.toFixed(2)}`);
    contextParts.push(`Active Analysis Layer: ${activeLayer.toUpperCase()}`);
    
    // Layer-specific data
    if (data.fires) {
      contextParts.push(`Fire Risk: ${data.fires.totalFires} active fires detected, ${data.fires.highConfidence} high confidence, Total fire power: ${data.fires.totalFirePower} MW`);
    }
    
    if (data.airQuality) {
      contextParts.push(`Air Quality: AQI ${data.airQuality.aqi} (${data.airQuality.level}), PM2.5: ${data.airQuality.pollutants.pm25.toFixed(1)} μg/m³, PM10: ${data.airQuality.pollutants.pm10.toFixed(1)} μg/m³`);
    }
    
    if (data.solar) {
      contextParts.push(`Solar Potential: ${data.solar.suitability} (${data.solar.averageRadiation.toFixed(2)} kWh/m²/day), Average annual production: ${data.solar.averageProduction.toFixed(0)} kWh/year, Capacity factor: ${data.solar.averageCapacityFactor.toFixed(1)}%`);
    }
    
    if (data.flood) {
      contextParts.push(`Flood Risk: Score ${data.flood.riskScore}/100 (${data.flood.riskLevel}), 24h precipitation: ${data.flood.precipitation24h} mm, 7-day: ${data.flood.precipitation7d} mm`);
    }
    
    if (data.temperature) {
      contextParts.push(`Temperature: Current ${data.temperature.currentTemp}°C, Historical avg: ${data.temperature.historicalAvg}°C, Anomaly: ${data.temperature.anomaly > 0 ? '+' : ''}${data.temperature.anomaly}°C (${data.temperature.trend})`);
    }

    if (data.ndvi) {
      contextParts.push(`Vegetation Health: NDVI ${data.ndvi.ndvi.toFixed(3)} (${data.ndvi.healthLevel}), Land cover: ${data.ndvi.landCover}, Cloud cover: ${data.ndvi.cloudCover.toFixed(1)}%`);
    }

    // Layer-specific prompt
    let focusArea = '';
    if (activeLayer === 'fires') {
      focusArea = 'Focus on fire risk assessment, wildfire prevention, and emergency preparedness for this region.';
    } else if (activeLayer === 'air') {
      focusArea = 'Focus on air quality impacts, health recommendations, and pollution mitigation strategies for this location.';
    } else if (activeLayer === 'solar') {
      focusArea = 'Focus on solar energy potential, ROI for solar installations, best practices for solar adoption, and renewable energy opportunities in this region.';
    } else if (activeLayer === 'floods') {
      focusArea = 'Focus on flood risk assessment, water management, drainage infrastructure, and flood preparedness for this area.';
    } else if (activeLayer === 'temperature') {
      focusArea = 'Focus on temperature trends, climate change impacts, heat/cold adaptation strategies, and long-term climate resilience.';
    } else if (activeLayer === 'ndvi') {
      focusArea = 'Focus on vegetation health, land use patterns, agricultural productivity, deforestation risks, and ecosystem conservation for this location.';
    }

    const prompt = `Analyze this region's ${activeLayer} data:

${contextParts.join('\n')}

${focusArea}

Provide a layer-specific analysis with:
1. **Assessment** (2-3 sentences focused on ${activeLayer})
2. **Key Risks** (top 3 risks related to ${activeLayer})
3. **Score** (0-100 rating for this specific aspect)
4. **Recommendations** (3 specific actions for ${activeLayer})

Format as JSON:
{
  "assessment": "string",
  "risks": [{"risk": "string", "severity": "low|medium|high|extreme", "description": "string"}],
  "futureProofScore": number,
  "scoreExplanation": "string",
  "recommendations": [{"action": "string", "impact": "string", "timeframe": "string"}]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze region' },
      { status: 500 }
    );
  }
}
