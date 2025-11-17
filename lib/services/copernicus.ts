/**
 * Copernicus Atmosphere Monitoring Service (CAMS)
 * Provides air quality data including PM2.5, PM10, NO2, O3, CO, SO2
 */

import { apiClient } from '../api-client';

export interface AirQualityData {
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  aqi: number; // Air Quality Index (0-500)
  level: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  color: string;
  pollutants: {
    pm25: number; // μg/m³
    pm10: number; // μg/m³
    no2: number; // μg/m³
    o3: number; // μg/m³
    co: number; // μg/m³
    so2: number; // μg/m³
  };
  healthRecommendation: string;
}

export interface AirQualityRegion {
  bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
  grid: Array<{
    lat: number;
    lon: number;
    aqi: number;
    level: string;
    color: string;
  }>;
}

/**
 * Calculate AQI from pollutant concentrations
 * Using US EPA AQI calculation method
 */
function calculateAQI(pollutants: {
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  co?: number;
  so2?: number;
}): { aqi: number; level: string; color: string } {
  const aqiBreakpoints = {
    pm25: [
      { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
      { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 },
      { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
      { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
      { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
      { low: 250.5, high: 500, aqiLow: 301, aqiHigh: 500 },
    ],
  };

  let maxAqi = 0;

  // Calculate AQI for PM2.5 (primary pollutant)
  if (pollutants.pm25 !== undefined) {
    for (const bp of aqiBreakpoints.pm25) {
      if (pollutants.pm25 >= bp.low && pollutants.pm25 <= bp.high) {
        const aqi = Math.round(
          ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (pollutants.pm25 - bp.low) + bp.aqiLow
        );
        maxAqi = Math.max(maxAqi, aqi);
        break;
      }
    }
  }

  // Simplified calculation for other pollutants
  if (pollutants.pm10 !== undefined && pollutants.pm10 > 50) {
    maxAqi = Math.max(maxAqi, Math.min(Math.round(pollutants.pm10 * 2), 500));
  }
  if (pollutants.no2 !== undefined && pollutants.no2 > 40) {
    maxAqi = Math.max(maxAqi, Math.min(Math.round(pollutants.no2 * 2.5), 500));
  }
  if (pollutants.o3 !== undefined && pollutants.o3 > 60) {
    maxAqi = Math.max(maxAqi, Math.min(Math.round(pollutants.o3 * 1.5), 500));
  }

  // Determine level and color
  let level = 'good';
  let color = '#00e400';

  if (maxAqi <= 50) {
    level = 'good';
    color = '#00e400';
  } else if (maxAqi <= 100) {
    level = 'moderate';
    color = '#ffff00';
  } else if (maxAqi <= 150) {
    level = 'unhealthy_sensitive';
    color = '#ff7e00';
  } else if (maxAqi <= 200) {
    level = 'unhealthy';
    color = '#ff0000';
  } else if (maxAqi <= 300) {
    level = 'very_unhealthy';
    color = '#8f3f97';
  } else {
    level = 'hazardous';
    color = '#7e0023';
  }

  return { aqi: maxAqi, level, color };
}

/**
 * Get health recommendation based on AQI level
 */
function getHealthRecommendation(level: string): string {
  const recommendations: Record<string, string> = {
    good: 'Air quality is satisfactory. Enjoy outdoor activities!',
    moderate: 'Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.',
    unhealthy_sensitive: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
    unhealthy: 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.',
    very_unhealthy: 'Health alert: everyone may experience more serious health effects. Avoid outdoor activities.',
    hazardous: 'Health warnings of emergency conditions. Everyone should avoid all outdoor exertion.',
  };

  return recommendations[level] || 'Air quality data unavailable.';
}

/**
 * Get air quality data for a specific location
 * Note: This uses OpenWeather Air Pollution API as a fallback
 * since Copernicus requires more complex authentication
 */
export async function getAirQuality(
  latitude: number,
  longitude: number
): Promise<AirQualityData> {
  const cacheKey = `air-quality:${latitude.toFixed(2)},${longitude.toFixed(2)}`;

  return await apiClient.fetchWithCache(
    cacheKey,
    async () => {
      // Check rate limit
      if (!apiClient.checkRateLimit('copernicus', 10, 60000)) {
        throw new Error('Rate limit exceeded for air quality API');
      }

      // Use OpenWeather Air Pollution API (free tier)
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenWeather API key not configured');
      }

      const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Air quality API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.list || data.list.length === 0) {
        throw new Error('No air quality data available');
      }

      const current = data.list[0];
      const components = current.components;

      // Calculate AQI from pollutants
      const { aqi, level, color } = calculateAQI({
        pm25: components.pm2_5,
        pm10: components.pm10,
        no2: components.no2,
        o3: components.o3,
        co: components.co / 1000, // Convert to μg/m³
        so2: components.so2,
      });

      return {
        location: { latitude, longitude },
        timestamp: new Date(current.dt * 1000).toISOString(),
        aqi,
        level: level as any,
        color,
        pollutants: {
          pm25: components.pm2_5 || 0,
          pm10: components.pm10 || 0,
          no2: components.no2 || 0,
          o3: components.o3 || 0,
          co: components.co / 1000 || 0,
          so2: components.so2 || 0,
        },
        healthRecommendation: getHealthRecommendation(level),
      };
    },
    60 * 60 * 1000 // Cache for 1 hour
  );
}

/**
 * Get air quality data for a region (grid)
 * Returns a grid of AQI values for visualization
 */
export async function getAirQualityRegion(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  gridSize: number = 5
): Promise<AirQualityRegion> {
  const cacheKey = `air-quality-region:${minLat},${minLon},${maxLat},${maxLon}:${gridSize}`;

  return await apiClient.fetchWithCache(
    cacheKey,
    async () => {
      const latStep = (maxLat - minLat) / gridSize;
      const lonStep = (maxLon - minLon) / gridSize;

      const grid: Array<{
        lat: number;
        lon: number;
        aqi: number;
        level: string;
        color: string;
      }> = [];

      // Sample grid points
      for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
          const lat = minLat + i * latStep;
          const lon = minLon + j * lonStep;

          try {
            const data = await getAirQuality(lat, lon);
            grid.push({
              lat,
              lon,
              aqi: data.aqi,
              level: data.level,
              color: data.color,
            });
          } catch (error) {
            console.error(`Failed to get air quality for ${lat},${lon}:`, error);
            // Add placeholder with unknown data
            grid.push({
              lat,
              lon,
              aqi: 0,
              level: 'unknown',
              color: '#cccccc',
            });
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        bounds: { minLat, minLon, maxLat, maxLon },
        grid,
      };
    },
    60 * 60 * 1000 // Cache for 1 hour
  );
}
