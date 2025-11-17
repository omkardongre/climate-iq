import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface EcoTip {
  category: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, userId } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Location coordinates required' },
        { status: 400 }
      );
    }

    // 1. Fetch weather and AQI data from OpenWeather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();

    // 2. Fetch Air Quality data
    const aqiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}`
    );

    let aqiData = null;
    if (aqiResponse.ok) {
      aqiData = await aqiResponse.json();
    }

    // 3. Build context for Gemini
    const aqi = aqiData?.list?.[0]?.main?.aqi || 0;
    const aqiLevel = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1] || 'Unknown';
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const weatherCondition = weatherData.weather[0].main;
    const cityName = weatherData.name;

    const context = `
You are an AI eco-advisor providing personalized daily sustainability tips.

Current Conditions for ${cityName}:
- Temperature: ${temp}°C
- Weather: ${weatherCondition}
- Humidity: ${humidity}%
- Air Quality Index (AQI): ${aqi} (${aqiLevel})
- PM2.5: ${aqiData?.list?.[0]?.components?.pm2_5 || 'N/A'} μg/m³
- PM10: ${aqiData?.list?.[0]?.components?.pm10 || 'N/A'} μg/m³

Generate 3 personalized eco-tips for today based on these conditions.

Categories: air_quality, energy, water, transport, waste

Priority levels:
- urgent: AQI > 150 or extreme weather
- high: AQI 100-150 or important actions
- medium: General good practices
- low: Optional suggestions

Format as JSON array:
[
  {
    "category": "air_quality",
    "title": "Avoid Outdoor Exercise",
    "content": "AQI is ${aqi} (${aqiLevel}). Stay indoors during peak pollution hours (6-10 AM, 6-10 PM).",
    "priority": "high"
  }
]

Rules:
1. Be specific to current conditions
2. Actionable advice (not generic)
3. Include health/environmental impact
4. Keep content under 150 characters
5. Return ONLY the JSON array, no other text
`;

    // 4. Generate tips with Gemini
    let tips: EcoTip[] = [];
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(context);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tips = JSON.parse(jsonMatch[0]);
      }
    } catch (aiError: any) {
      console.error('Gemini API error:', aiError.message);
      return NextResponse.json(
        { 
          error: 'AI service unavailable',
          message: aiError.message || 'Failed to generate eco-tips. Please try again.',
        },
        { status: 503 }
      );
    }

    // 5. If no tips generated, return error
    if (!tips || tips.length === 0) {
      return NextResponse.json(
        { 
          error: 'No tips generated',
          message: 'AI did not return any eco-tips. Please try again.',
        },
        { status: 500 }
      );
    }

    // 6. Save tips to Supabase (if userId provided)
    if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const today = new Date().toISOString().split('T')[0];
      
      for (const tip of tips) {
        // Check if tip exists
        const { data: existing } = await supabase
          .from('eco_advisor_tips')
          .select('id')
          .eq('user_id', userId)
          .eq('tip_date', today)
          .eq('tip_category', tip.category)
          .single();

        const tipData = {
          user_id: userId,
          tip_date: today,
          tip_category: tip.category,
          tip_title: tip.title,
          tip_content: tip.content,
          tip_priority: tip.priority,
          weather_context: {
            temp,
            aqi,
            aqiLevel,
            weather: weatherCondition,
            city: cityName,
          },
        };

        if (existing) {
          await supabase
            .from('eco_advisor_tips')
            .update(tipData)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('eco_advisor_tips')
            .insert(tipData);
        }
      }
    }

    // 7. Return tips with weather context
    return NextResponse.json({
      tips,
      weather: {
        city: cityName,
        temp,
        condition: weatherCondition,
        humidity,
        aqi,
        aqiLevel,
        pm25: aqiData?.list?.[0]?.components?.pm2_5,
        pm10: aqiData?.list?.[0]?.components?.pm10,
      },
    });

  } catch (error: any) {
    console.error('Eco-advisor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate eco-tips' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch saved tips
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('eco_advisor_tips')
      .select('*')
      .eq('user_id', userId)
      .eq('tip_date', today)
      .order('tip_priority', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tips: data || [] });

  } catch (error: any) {
    console.error('Fetch tips error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tips' },
      { status: 500 }
    );
  }
}
