/**
 * Flood Risk Assessment Service
 * Uses precipitation data to estimate flood risk
 */

interface FloodRiskData {
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  riskScore: number; // 0-100
  precipitation24h: number;
  precipitation7d: number;
  drainageCapacity: number; // estimated
  color: string;
  description: string;
  recommendations: string[];
}

export async function assessFloodRisk(lat: number, lon: number): Promise<FloodRiskData> {
  // Use OpenWeather API for precipitation data
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }

  try {
    // Get current weather + forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Calculate precipitation for next 24h and 7d
    let precipitation24h = 0;
    let precipitation7d = 0;
    
    data.list.forEach((item: any, index: number) => {
      const rain = item.rain?.['3h'] || 0;
      if (index < 8) { // 24 hours (8 * 3h intervals)
        precipitation24h += rain;
      }
      precipitation7d += rain;
    });

    // Estimate drainage capacity based on terrain (simplified)
    // In real system, this would come from city infrastructure data
    const elevation = data.city.coord.lat; // Simplified
    const drainageCapacity = Math.abs(elevation) > 30 ? 80 : 60; // Higher elevation = better drainage

    // Calculate flood risk score (0-100)
    const riskScore = Math.min(
      100,
      (precipitation24h / drainageCapacity) * 100 + 
      (precipitation7d / (drainageCapacity * 7)) * 50
    );

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
    let color: string;
    let description: string;
    let recommendations: string[];

    if (riskScore < 25) {
      riskLevel = 'low';
      color = '#22c55e'; // green
      description = 'Low flood risk. Normal conditions.';
      recommendations = [
        'No immediate action required',
        'Monitor weather forecasts',
      ];
    } else if (riskScore < 50) {
      riskLevel = 'moderate';
      color = '#eab308'; // yellow
      description = 'Moderate flood risk. Stay alert.';
      recommendations = [
        'Monitor local weather alerts',
        'Check drainage systems',
        'Prepare emergency supplies',
      ];
    } else if (riskScore < 75) {
      riskLevel = 'high';
      color = '#f97316'; // orange
      description = 'High flood risk. Take precautions.';
      recommendations = [
        'Avoid low-lying areas',
        'Secure outdoor items',
        'Have evacuation plan ready',
        'Stay informed via emergency channels',
      ];
    } else {
      riskLevel = 'extreme';
      color = '#dc2626'; // red
      description = 'Extreme flood risk. Immediate action required.';
      recommendations = [
        'Follow evacuation orders immediately',
        'Move to higher ground',
        'Do not drive through flooded areas',
        'Contact emergency services if needed',
      ];
    }

    return {
      riskLevel,
      riskScore: Math.round(riskScore),
      precipitation24h: Math.round(precipitation24h * 10) / 10,
      precipitation7d: Math.round(precipitation7d * 10) / 10,
      drainageCapacity,
      color,
      description,
      recommendations,
    };
  } catch (error) {
    console.error('Flood risk assessment error:', error);
    throw error;
  }
}
