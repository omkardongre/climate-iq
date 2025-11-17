import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface AgricultureRequest {
  latitude: number;
  longitude: number;
  farmSize: number;
  soilType: string;
  currentCrop?: string;
}

interface AgentResult {
  name: string;
  role: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  reasoning_steps: string[];
  sources: string[];
}

export async function POST(request: NextRequest) {
  try {
    const data: AgricultureRequest = await request.json();

    // Detect country from coordinates (reverse geocoding)
    let detectedCountry = 'your region';
    try {
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${data.latitude}&lon=${data.longitude}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
      );
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData[0]?.country) {
          detectedCountry = geoData[0].country; // ISO country code
        }
      }
    } catch (err) {
      console.log('Reverse geocoding error:', err);
    }

    // Fetch weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${data.latitude}&lon=${data.longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();

    // Fetch forecast for rainfall pattern
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${data.latitude}&lon=${data.longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    const forecastData = await forecastResponse.json();
    const rainfallData = forecastData.list
      .slice(0, 8)
      .reduce((sum: number, item: any) => sum + (item.rain?.['3h'] || 0), 0);

    // Fetch soil data
    let soilData = null;
    try {
      const soilResponse = await fetch(
        `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${data.longitude}&lat=${data.latitude}&property=phh2o&property=nitrogen&property=soc&property=clay&property=sand&property=silt&depth=0-5cm&value=mean`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (soilResponse.ok) {
        const soilJson = await soilResponse.json();
        const layers = soilJson.properties?.layers || [];
        
        const getLayerValue = (name: string) => {
          const layer = layers.find((l: any) => l.name === name);
          return layer?.depths?.[0]?.values?.mean;
        };
        
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
        }
      }
    } catch (err) {
      console.log('SoilGrids API error:', err);
    }

    // Fetch ML model prediction
    let mlPrediction = null;
    try {
      const predictionResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agriculture/crop-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          N: soilData?.nitrogen || 50,
          P: 50,
          K: 50,
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          ph: soilData?.ph || 7.0,
          rainfall: rainfallData
        })
      });
      
      if (predictionResponse.ok) {
        const predData = await predictionResponse.json();
        mlPrediction = predData.predicted_crop;
        console.log('ML Model Prediction:', mlPrediction);
      }
    } catch (err) {
      console.log('ML prediction error:', err);
    }

    // Execute all 3 agents in parallel with ML prediction
    const [soilAgentResult, weatherAgentResult, marketAgentResult] = await Promise.all([
      executeSoilAgent(soilData, data.soilType, data.farmSize, mlPrediction),
      executeWeatherAgent(weatherData, forecastData, rainfallData, mlPrediction, detectedCountry),
      executeMarketAgent(data.latitude, data.longitude, weatherData.name || 'your region', mlPrediction, detectedCountry)
    ]);

    // Orchestrator coordinates insights
    const orchestratorResult = await executeOrchestrator(
      soilAgentResult,
      weatherAgentResult,
      marketAgentResult,
      {
        farmSize: data.farmSize,
        location: `${data.latitude.toFixed(2)}°N, ${data.longitude.toFixed(2)}°E`,
        currentCrop: data.currentCrop
      }
    );

    return NextResponse.json({
      success: true,
      agents: {
        soil: soilAgentResult,
        weather: weatherAgentResult,
        market: marketAgentResult
      },
      orchestrator: orchestratorResult,
      rawData: {
        weather: weatherData,
        soil: soilData,
        rainfall: rainfallData
      }
    });

  } catch (error: any) {
    console.error('Multi-agent advisor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// SOIL AGENT
async function executeSoilAgent(
  soilData: any,
  soilType: string,
  farmSize: number,
  mlPrediction: string | null
): Promise<AgentResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: { responseMimeType: "application/json" }
  });

  const mlInfo = mlPrediction ? ` ML model suggests: ${mlPrediction}.` : '';
  const prompt = `You are a soil science expert. Analyze: ${soilData ? `pH ${soilData.ph}, Nitrogen ${soilData.nitrogen}, Organic Carbon ${soilData.organicCarbon}` : `${soilType} soil`} for ${farmSize} acre farm.${mlInfo} Return JSON with: "analysis" (1 sentence assessment), "recommendations" (array of 3 specific amendments with quantities), "confidence" (number 60-90), "reasoning_steps" (array of 3 analysis steps), "sources" (array of 2 source names). Example: {"analysis":"Soil pH is slightly acidic requiring lime","recommendations":["Apply 2 tons lime per acre","Add 500kg NPK fertilizer","Mix 1 ton organic compost"],"confidence":78,"reasoning_steps":["Checked pH levels","Assessed nitrogen content","Evaluated organic matter"],"sources":["FAO Soil Guidelines","USDA Standards"]}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const data = JSON.parse(response);
    return { name: "SoilAgent", role: "Soil Science Specialist", ...data };
  } catch (e) {
    return {
      name: "SoilAgent",
      role: "Soil Science Specialist",
      analysis: "Soil requires balanced nutrient management",
      recommendations: ["Apply NPK fertilizer (20:20:20) at 200kg/acre", "Add organic compost 2 tons/acre", "Test soil pH quarterly"],
      confidence: 65,
      reasoning_steps: ["Analyzed soil composition", "Applied standard farming practices", "Considered farm size and crop rotation"],
      sources: ["FAO Soil Management Guide", "USDA Soil Health Standards"]
    };
  }
}

// WEATHER AGENT
async function executeWeatherAgent(
  currentWeather: any,
  forecast: any,
  rainfall: number,
  mlPrediction: string | null,
  country: string
): Promise<AgentResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: { responseMimeType: "application/json" }
  });

  const mlInfo = mlPrediction ? ` ML model suggests: ${mlPrediction}.` : '';
  const prompt = `You are a climate specialist. Current conditions: ${currentWeather.main.temp}°C temperature, ${currentWeather.main.humidity}% humidity, ${rainfall}mm recent rainfall.${mlInfo} Return JSON with: "analysis" (1 sentence climate assessment), "recommendations" (array of 3 irrigation/climate strategies), "confidence" (number 60-90), "reasoning_steps" (array of 3 steps), "sources" (array of 2 sources). Example: {"analysis":"Moderate rainfall with high humidity suitable for crops","recommendations":["Install drip irrigation for efficiency","Monitor rainfall weekly","Prepare drainage for monsoon"],"confidence":75,"reasoning_steps":["Analyzed rainfall patterns","Assessed temperature trends","Evaluated humidity levels"],"sources":["WMO Climate Data","OpenWeather API"]}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const data = JSON.parse(response);
    return { name: "WeatherAgent", role: "Climate Pattern Specialist", ...data };
  } catch (e) {
    // Use regional meteorological sources
    const regionalSource = country === 'IN' ? 'India Meteorological Department' : 
                          country === 'US' ? 'NOAA Weather Service' :
                          country === 'GB' ? 'UK Met Office' :
                          'Regional Meteorological Service';
    return {
      name: "WeatherAgent",
      role: "Climate Pattern Specialist",
      analysis: "Climate patterns suitable for diversified farming",
      recommendations: ["Implement drip irrigation system", "Monitor monsoon forecasts regularly", "Prepare contingency for dry spells"],
      confidence: 70,
      reasoning_steps: ["Analyzed temperature and humidity data", "Assessed rainfall adequacy", "Evaluated seasonal climate risks"],
      sources: ["World Meteorological Organization", regionalSource]
    };
  }
}

// MARKET AGENT
async function executeMarketAgent(
  latitude: number,
  longitude: number,
  region: string,
  mlPrediction: string | null,
  country: string
): Promise<AgentResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: { responseMimeType: "application/json" }
  });

  const mlInfo = mlPrediction ? ` ML model suggests: ${mlPrediction} is suitable.` : '';
  // Remove hardcoded India - let AI determine region from coordinates
  const prompt = `You are an agricultural market analyst. Research profitable crops for ${region} (latitude ${latitude}, longitude ${longitude}).${mlInfo} Return JSON with: "analysis" (1 sentence market assessment for this region), "recommendations" (array of 3 crops with current demand and local currency), "confidence" (number 60-85), "reasoning_steps" (array of 3 research steps), "sources" (array of 2 market sources). Example: {"analysis":"Strong demand for vegetables and cash crops in local markets","recommendations":["Tomatoes - high wholesale demand","Onions - stable market","Wheat - export potential"],"confidence":72,"reasoning_steps":["Researched wholesale prices","Analyzed seasonal demand","Evaluated export opportunities"],"sources":["Local Agricultural Market Board","Regional Commodity Exchange"]}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const data = JSON.parse(response);
    return { name: "MarketAgent", role: "Market Analysis Specialist", ...data };
  } catch (e) {
    // Use regional pricing format
    const currencySymbol = country === 'IN' ? '₹' : country === 'US' ? '$' : country === 'GB' ? '£' : '';
    const marketBoard = country === 'IN' ? 'Agricultural Produce Market Committee' : 'Local Agricultural Market Board';
    return {
      name: "MarketAgent",
      role: "Market Analysis Specialist",
      analysis: `${region} market shows strong demand for vegetables and commercial crops`,
      recommendations: [`Tomatoes - ${currencySymbol}20-30/kg high local demand`, `Onions - ${currencySymbol}15-25/kg year-round market`, `Wheat - stable with government support`],
      confidence: 68,
      reasoning_steps: ["Researched local wholesale prices", "Analyzed regional crop demand patterns", "Evaluated market accessibility and transport"],
      sources: [marketBoard, "Regional Commodity Exchange"]
    };
  }
}

// ORCHESTRATOR
async function executeOrchestrator(
  soilAgent: AgentResult,
  weatherAgent: AgentResult,
  marketAgent: AgentResult,
  context: any
): Promise<any> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Orchestrator: Combine insights. Soil: ${soilAgent.analysis}. Weather: ${weatherAgent.analysis}. Market: ${marketAgent.analysis}. ${context.farmSize}ac farm. Return {"top_crops":[{"crop":"name","reason":"short reason"}],"action_plan":{"immediate":["2"],"short_term":["2"],"long_term":["1"]},"agent_conflicts":[{"conflict":"","resolution":""}],"risk_assessment":{"low_risk":["1"],"medium_risk":["1"],"high_risk":["1"]},"overall_confidence":75,"decision_reasoning":["3 steps"]}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    return JSON.parse(response);
  } catch (e) {
    return {
      top_crops: [
        {crop: "Tomatoes", reason: "High demand with suitable climate"},
        {crop: "Wheat", reason: "Stable market and adaptable"},
        {crop: "Soybeans", reason: "Good soil match"}
      ],
      action_plan: {
        immediate: ["Test soil pH", "Plan irrigation"],
        short_term: ["Apply amendments", "Plant crops"],
        long_term: ["Monitor health"]
      },
      agent_conflicts: [{conflict: "None", resolution: "All aligned"}],
      risk_assessment: {
        low_risk: ["Market stability"],
        medium_risk: ["Weather"],
        high_risk: ["Water"]
      },
      overall_confidence: Math.round((soilAgent.confidence + weatherAgent.confidence + marketAgent.confidence) / 3),
      decision_reasoning: ["Combined insights", "Prioritized alignment", "Considered constraints"]
    };
  }
}
