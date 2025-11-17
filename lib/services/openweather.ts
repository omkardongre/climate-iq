/**
 * OpenWeather API Service
 * Handles weather, air quality, and forecast data
 */

import axios from 'axios';
import { apiClient } from '../api-client';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

// Rate limiting: 60 calls per minute for free tier
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  timestamp: number;
}

export interface AirQualityData {
  aqi: number; // 1-5 scale
  aqiLabel: string;
  pm2_5: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  timestamp: number;
}

export interface ForecastData {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  precipitation: number;
}

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('OPENWEATHER_API_KEY not configured');
    return null;
  }

  // Check rate limit
  if (!apiClient.checkRateLimit('openweather', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    throw new Error('OpenWeather API rate limit exceeded');
  }

  const cacheKey = `weather:${lat}:${lon}`;
  
  try {
    return await apiClient.fetchWithCache(
      cacheKey,
      async () => {
        const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
          params: {
            lat,
            lon,
            appid: apiKey,
            units: 'metric',
          },
        });

        const data = response.data;
        return {
          location: data.name,
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          timestamp: Date.now(),
        };
      },
      10 * 60 * 1000 // Cache for 10 minutes
    );
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

/**
 * Get air quality data for a location
 */
export async function getAirQuality(
  lat: number,
  lon: number
): Promise<AirQualityData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('OPENWEATHER_API_KEY not configured');
    return null;
  }

  if (!apiClient.checkRateLimit('openweather', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    throw new Error('OpenWeather API rate limit exceeded');
  }

  const cacheKey = `airquality:${lat}:${lon}`;

  try {
    return await apiClient.fetchWithCache(
      cacheKey,
      async () => {
        const response = await axios.get(OPENWEATHER_AIR_URL, {
          params: {
            lat,
            lon,
            appid: apiKey,
          },
        });

        const data = response.data.list[0];
        const aqi = data.main.aqi;
        const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

        return {
          aqi,
          aqiLabel: aqiLabels[aqi - 1] || 'Unknown',
          pm2_5: data.components.pm2_5,
          pm10: data.components.pm10,
          co: data.components.co,
          no2: data.components.no2,
          o3: data.components.o3,
          so2: data.components.so2,
          timestamp: Date.now(),
        };
      },
      30 * 60 * 1000 // Cache for 30 minutes
    );
  } catch (error) {
    console.error('Error fetching air quality:', error);
    return null;
  }
}

/**
 * Get 5-day weather forecast
 */
export async function getWeatherForecast(
  lat: number,
  lon: number
): Promise<ForecastData[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('OPENWEATHER_API_KEY not configured');
    return [];
  }

  if (!apiClient.checkRateLimit('openweather', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    throw new Error('OpenWeather API rate limit exceeded');
  }

  const cacheKey = `forecast:${lat}:${lon}`;

  try {
    return await apiClient.fetchWithCache(
      cacheKey,
      async () => {
        const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
          params: {
            lat,
            lon,
            appid: apiKey,
            units: 'metric',
          },
        });

        // Group by day and get min/max temps
        const dailyData: { [key: string]: any } = {};
        
        response.data.list.forEach((item: any) => {
          const date = item.dt_txt.split(' ')[0];
          if (!dailyData[date]) {
            dailyData[date] = {
              temps: [],
              descriptions: [],
              icons: [],
              precipitation: 0,
            };
          }
          dailyData[date].temps.push(item.main.temp);
          dailyData[date].descriptions.push(item.weather[0].description);
          dailyData[date].icons.push(item.weather[0].icon);
          if (item.rain) {
            dailyData[date].precipitation += item.rain['3h'] || 0;
          }
        });

        return Object.entries(dailyData).slice(0, 5).map(([date, data]: [string, any]) => ({
          date,
          tempMin: Math.round(Math.min(...data.temps)),
          tempMax: Math.round(Math.max(...data.temps)),
          description: data.descriptions[0],
          icon: data.icons[0],
          precipitation: Math.round(data.precipitation),
        }));
      },
      60 * 60 * 1000 // Cache for 1 hour
    );
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return [];
  }
}

/**
 * Calculate bushfire risk based on weather conditions
 */
export function calculateBushfireRisk(weather: WeatherData): {
  riskLevel: 'low' | 'moderate' | 'high' | 'severe' | 'extreme';
  riskScore: number;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Temperature factor (0-40 points)
  if (weather.temperature > 35) {
    score += 40;
    factors.push('Extreme heat');
  } else if (weather.temperature > 30) {
    score += 30;
    factors.push('High temperature');
  } else if (weather.temperature > 25) {
    score += 20;
    factors.push('Warm temperature');
  }

  // Humidity factor (0-30 points)
  if (weather.humidity < 20) {
    score += 30;
    factors.push('Very low humidity');
  } else if (weather.humidity < 30) {
    score += 20;
    factors.push('Low humidity');
  } else if (weather.humidity < 40) {
    score += 10;
    factors.push('Moderate humidity');
  }

  // Wind factor (0-30 points)
  if (weather.windSpeed > 40) {
    score += 30;
    factors.push('Extreme winds');
  } else if (weather.windSpeed > 25) {
    score += 20;
    factors.push('Strong winds');
  } else if (weather.windSpeed > 15) {
    score += 10;
    factors.push('Moderate winds');
  }

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'severe' | 'extreme';
  if (score >= 80) riskLevel = 'extreme';
  else if (score >= 60) riskLevel = 'severe';
  else if (score >= 40) riskLevel = 'high';
  else if (score >= 20) riskLevel = 'moderate';
  else riskLevel = 'low';

  return { riskLevel, riskScore: score, factors };
}
