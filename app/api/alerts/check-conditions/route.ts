import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface WeatherData {
  temperature: number;
  aqi: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
}

interface Alert {
  type: 'thermal_anomaly' | 'air_quality' | 'flood_risk' | 'temperature_extreme';
  severity: 'info' | 'advisory' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  actionItems: string[];
  expiresAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    // Fetch weather data from OpenWeather API
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();

    // Fetch air quality data
    const aqiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}`
    );

    let aqi = 0;
    if (aqiResponse.ok) {
      const aqiData = await aqiResponse.json();
      aqi = aqiData.list[0]?.main?.aqi || 0;
    }

    // Extract relevant data
    const conditions: WeatherData = {
      temperature: weatherData.main.temp,
      aqi: aqi,
      rainfall: weatherData.rain?.['1h'] || weatherData.rain?.['3h'] || 0,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed
    };

    // Use Gemini AI to analyze conditions
    const alerts = await analyzeConditionsWithAI(conditions, weatherData.name);

    return NextResponse.json({
      success: true,
      location: weatherData.name,
      conditions,
      alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking conditions:', error);
    return NextResponse.json(
      { error: 'Failed to check alert conditions' },
      { status: 500 }
    );
  }
}

async function analyzeConditionsWithAI(
  conditions: WeatherData,
  locationName: string
): Promise<Alert[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  });

  const prompt = `You are a climate alert monitoring agent. Analyze these weather conditions and determine if any alerts should be generated.

**Location:** ${locationName}

**Current Conditions:**
- Temperature: ${conditions.temperature}°C
- Air Quality Index: ${conditions.aqi} (1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor)
- Rainfall: ${conditions.rainfall}mm/hour
- Humidity: ${conditions.humidity}%
- Wind Speed: ${conditions.windSpeed}m/s

**Alert Types to Check:**

1. **Thermal Anomaly:** 
   - Temperature >40°C = WARNING
   - Temperature >45°C = CRITICAL
   - Temperature >48°C = EMERGENCY

2. **Air Quality:**
   - AQI 3 = ADVISORY (Moderate)
   - AQI 4 = WARNING (Poor)
   - AQI 5 = CRITICAL (Very Poor)

3. **Flood Risk:**
   - Rainfall >10mm/h = ADVISORY
   - Rainfall >20mm/h = WARNING
   - Rainfall >50mm/h = EMERGENCY

4. **Temperature Extreme:**
   - < 5°C = WARNING (Coldwave)
   - < 0°C = CRITICAL (Freezing)
   - > 35°C = ADVISORY (Heatwave)
   - > 40°C = WARNING (Severe Heatwave)

**Instructions:**
1. Analyze each condition against thresholds
2. Generate alerts ONLY if thresholds exceeded
3. For each alert, provide:
   - type: one of ['thermal_anomaly', 'air_quality', 'flood_risk', 'temperature_extreme']
   - severity: one of ['info', 'advisory', 'warning', 'critical', 'emergency']
   - title: Short alert title (max 60 chars)
   - message: Detailed explanation (max 200 chars)
   - actionItems: Array of 2-3 specific actions users should take
   - expiresAt: ISO timestamp (6 hours from now)

4. If NO alerts needed, return empty array []

**Return ONLY valid JSON array of alerts. No markdown, no explanation.**

Example response:
[
  {
    "type": "thermal_anomaly",
    "severity": "warning",
    "title": "High Temperature Alert",
    "message": "Temperature at 42°C, well above normal. Heat stress risk for outdoor activities.",
    "actionItems": [
      "Avoid outdoor activities 11 AM - 4 PM",
      "Drink 3-4 liters of water today",
      "Check on elderly neighbors"
    ],
    "expiresAt": "${new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()}"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean and parse response
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const alerts: Alert[] = JSON.parse(cleanedText);
    
    // Validate and return
    if (!Array.isArray(alerts)) {
      console.error('AI response not an array:', cleanedText);
      return [];
    }

    return alerts;

  } catch (error) {
    console.error('Error analyzing conditions with AI:', error);
    return [];
  }
}
