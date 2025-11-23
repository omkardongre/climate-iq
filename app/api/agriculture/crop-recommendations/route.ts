import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface CropRequest {
  latitude: number;
  longitude: number;
  farmSize: number;
  soilType: string;
  currentCrop?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: CropRequest = await request.json();

    // Fetch weather data from OpenWeather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${data.latitude}&lon=${data.longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();

    // Fetch historical weather (last 5 days for rainfall pattern)
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${data.latitude}&lon=${data.longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    const forecastData = await forecastResponse.json();

    // Calculate average rainfall
    const rainfallData = forecastData.list
      .slice(0, 8) // Last 24 hours
      .reduce((sum: number, item: any) => sum + (item.rain?.['3h'] || 0), 0);

    // Fetch soil data from SoilGrids API (ISRIC - free, no API key needed)
    let soilData = null;
    try {
      const soilResponse = await fetch(
        `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${data.longitude}&lat=${data.latitude}&property=phh2o&property=nitrogen&property=soc&property=clay&property=sand&property=silt&depth=0-5cm&value=mean`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (soilResponse.ok) {
        const soilJson = await soilResponse.json();
        
        // Parse the response structure correctly
        const layers = soilJson.properties?.layers || [];
        
        const getLayerValue = (name: string) => {
          const layer = layers.find((l: any) => l.name === name);
          return layer?.depths?.[0]?.values?.mean;
        };
        
        // Check if we have any valid data
        const hasData = layers.some((l: any) => l.depths?.[0]?.values?.mean !== null);
        
        if (hasData) {
          soilData = {
            ph: getLayerValue('phh2o') ? (getLayerValue('phh2o') / 10).toFixed(1) : 'N/A',
            nitrogen: getLayerValue('nitrogen') ? getLayerValue('nitrogen').toFixed(0) : 'N/A',
            organicCarbon: getLayerValue('soc') ? (getLayerValue('soc') / 10).toFixed(1) : 'N/A',
            clay: getLayerValue('clay') ? (getLayerValue('clay') / 10).toFixed(1) : 'N/A',
            sand: getLayerValue('sand') ? (getLayerValue('sand') / 10).toFixed(1) : 'N/A',
            silt: getLayerValue('silt') ? (getLayerValue('silt') / 10).toFixed(1) : 'N/A',
          };
          // console.log('✅ SoilGrids data available:', soilData);
        } else {
          console.log('⚠️ SoilGrids: No data available for this location');
          soilData = { message: 'No satellite soil data available for this location' };
        }
      } else {
        console.log('SoilGrids API returned status:', soilResponse.status);
      }
    } catch (err) {
      console.log('SoilGrids API error:', err);
    }

    // add temp log to see soil data is fetched or not
    // console.log('Soil Data:', soilData);


    // add temp log to see weather data is fetched or not
    // console.log('Weather Data:', weatherData);



    // ... (previous code)

    // Try to get ML prediction
    let mlPrediction = null;
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      
      // Construct arguments: N P K temp humidity ph rainfall
      // Note: We are using estimated NPK values if SoilGrids failed, or defaults
      // For a hackathon, we can use reasonable defaults if data is missing
      const n = soilData?.nitrogen || 90;
      const p = 42; // Default/Estimated
      const k = 43; // Default/Estimated
      const temp = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const ph = soilData?.ph || 6.5;
      const rainfall = rainfallData || 200; // Fallback if no rain
      
      const scriptPath = path.join(process.cwd(), 'ml', 'predict.py');
      
      // Wrap in a promise to await the child process
      const getPrediction = () => new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
          scriptPath,
          n.toString(), p.toString(), k.toString(),
          temp.toString(), humidity.toString(),
          ph.toString(), rainfall.toString()
        ]);
        
        let dataString = '';
        
        pythonProcess.stdout.on('data', (data: any) => {
          dataString += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data: any) => {
          console.error(`ML Script Error: ${data}`);
        });
        
        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(dataString));
            } catch (e) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
      
      mlPrediction = await getPrediction();
      console.log('🤖 ML Model Prediction:', mlPrediction);
      
    } catch (e) {
      console.error('Failed to run ML model:', e);
    }

    // Build context for Gemini
    const context = `
Location: ${data.latitude.toFixed(2)}°N, ${data.longitude.toFixed(2)}°E
Farm Size: ${data.farmSize} acres
Soil Type: ${data.soilType}
Current/Previous Crop: ${data.currentCrop || 'None specified'}

Current Weather:
- Temperature: ${weatherData.main.temp}°C
- Humidity: ${weatherData.main.humidity}%
- Climate: ${weatherData.weather[0].description}
- Recent Rainfall: ${rainfallData.toFixed(1)}mm

${soilData ? `
Soil Analysis (SoilGrids Satellite Data):
- pH Level: ${soilData.ph}
- Nitrogen Content: ${soilData.nitrogen} cg/kg
- Organic Carbon: ${soilData.organicCarbon} g/kg
- Clay: ${soilData.clay}%
- Sand: ${soilData.sand}%
- Silt: ${soilData.silt}%
` : ''}

${mlPrediction && (mlPrediction as any).success ? `
🤖 AI MODEL PREDICTION (Random Forest):
- Recommended Crop: ${(mlPrediction as any).recommended_crop}
- Confidence: ${((mlPrediction as any).confidence * 100).toFixed(1)}%
- Top Alternatives: ${(mlPrediction as any).top_3.map((t: any) => t.crop).join(', ')}

IMPORTANT: The custom ML model strongly suggests growing ${(mlPrediction as any).recommended_crop}. Please prioritize this in your recommendations if suitable.
` : ''}

Analyze this farm's conditions and recommend the TOP 3 most suitable crops.
Consider:
1. Climate compatibility
2. Soil type suitability
3. Water availability
4. Market demand
5. Crop rotation benefits (if previous crop specified)
6. The ML Model's prediction (if available)

Format as JSON array:
[
  {
    "cropName": "string",
    "successRate": number (0-100),
    "yieldEstimate": "string (e.g., '2-3 tons/acre')",
    "waterNeeds": "string (Low/Medium/High)",
    "plantingTime": "string (e.g., 'March-April')",
    "harvestTime": "string (e.g., 'June-July')",
    "benefits": ["string", "string", "string"],
    "challenges": ["string", "string"]
  }
]

Provide practical, region-specific recommendations.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      recommendations,
      weatherSummary: {
        temperature: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        rainfall: rainfallData,
        condition: weatherData.weather[0].description,
      },
      soilData: soilData || { message: 'Using user-provided soil type' },
    });
  } catch (error: any) {
    console.error('Crop recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate crop recommendations' },
      { status: 500 }
    );
  }
}
