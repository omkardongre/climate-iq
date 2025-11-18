/**
 * NASA FIRMS (Fire Information for Resource Management System)
 * Provides real-time active fire data from MODIS and VIIRS satellites
 */

import axios from 'axios';
import { apiClient } from '../api-client';

const FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api';

// Rate limiting: Be respectful with NASA's free service
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export interface FireData {
  latitude: number;
  longitude: number;
  brightness: number; // Kelvin
  scan: number; // km
  track: number; // km
  acq_date: string; // YYYY-MM-DD
  acq_time: string; // HHMM
  satellite: string; // Terra, Aqua, SNPP, NOAA-20
  confidence: number | string; // 0-100 or 'l', 'n', 'h'
  version: string;
  bright_t31: number; // Kelvin
  frp: number; // Fire Radiative Power (MW)
  daynight: 'D' | 'N';
}

export interface FireStats {
  totalFires: number;
  highConfidence: number;
  averageBrightness: number;
  totalFirePower: number; // Total FRP
  lastUpdate: string;
}

/**
 * Get active fires for a specific area (bounding box)
 * @param bounds - [minLon, minLat, maxLon, maxLat]
 * @param days - Number of days to look back (1-10)
 */
export async function getActiveFires(
  bounds: [number, number, number, number],
  days: number = 1
): Promise<FireData[]> {
  // Check rate limit
  if (!apiClient.checkRateLimit('nasa-firms', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    throw new Error('NASA FIRMS API rate limit exceeded');
  }

  const [minLon, minLat, maxLon, maxLat] = bounds;
  const apiKey = process.env.NASA_FIRMS_API_KEY;

  // Validate bounds
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
    throw new Error('Invalid coordinates');
  }

  const cacheKey = `fires:${bounds.join(',')}:${days}`;

  try {
    return await apiClient.fetchWithCache(
      cacheKey,
      async () => {
        let url: string;

        if (apiKey) {
          // With API key - more data available
          url = `${FIRMS_BASE_URL}/area/csv/${apiKey}/VIIRS_SNPP_NRT/${minLon},${minLat},${maxLon},${maxLat}/${days}`;
        } else {
          // Without API key - last 24 hours only
          url = `${FIRMS_BASE_URL}/area/csv/no_key/VIIRS_SNPP_NRT/${minLon},${minLat},${maxLon},${maxLat}/1`;
          console.warn('NASA FIRMS: Using public endpoint (24h data only). Add API key for more data.');
        }

        const response = await axios.get(url, {
          timeout: 10000,
        });

        // Parse CSV response
        const lines = response.data.split('\n');
        const headers = lines[0].split(',');
        const fires: FireData[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',');
          if (values.length < headers.length) continue;

          const fire: any = {};
          headers.forEach((header: string, index: number) => {
            const key = header.trim();
            const value = values[index].trim();
            
            // Convert numeric fields
            if (['latitude', 'longitude', 'brightness', 'scan', 'track', 'bright_t31', 'frp'].includes(key)) {
              fire[key] = parseFloat(value);
            } else if (key === 'confidence') {
              // Confidence can be numeric or 'l', 'n', 'h'
              fire[key] = isNaN(Number(value)) ? value : Number(value);
            } else {
              fire[key] = value;
            }
          });

          fires.push(fire as FireData);
        }

        console.log(`NASA FIRMS: Found ${fires.length} active fires`);
        return fires;
      },
      15 * 60 * 1000 // Cache for 15 minutes
    );
  } catch (error: any) {
    console.error('Error fetching fire data:', error.message);
    
    // Return empty array on error (don't break the app)
    return [];
  }
}

/**
 * Get fires near a specific point
 * @param lat - Latitude
 * @param lon - Longitude
 * @param radiusKm - Radius in kilometers
 */
export async function getFiresNearPoint(
  lat: number,
  lon: number,
  radiusKm: number = 100
): Promise<FireData[]> {
  // Convert radius to approximate lat/lon bounds
  const latDelta = radiusKm / 111; // 1 degree lat ≈ 111 km
  const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const bounds: [number, number, number, number] = [
    lon - lonDelta,
    lat - latDelta,
    lon + lonDelta,
    lat + latDelta,
  ];

  return getActiveFires(bounds);
}

/**
 * Calculate fire statistics for an area
 */
export function calculateFireStats(fires: FireData[]): FireStats {
  if (fires.length === 0) {
    return {
      totalFires: 0,
      highConfidence: 0,
      averageBrightness: 0,
      totalFirePower: 0,
      lastUpdate: new Date().toISOString(),
    };
  }

  let highConfidence = 0;
  let totalBrightness = 0;
  let totalFRP = 0;

  fires.forEach(fire => {
    // Count high confidence fires
    if (
      (typeof fire.confidence === 'number' && fire.confidence >= 80) ||
      fire.confidence === 'h'
    ) {
      highConfidence++;
    }

    totalBrightness += fire.brightness || 0;
    totalFRP += fire.frp || 0;
  });

  return {
    totalFires: fires.length,
    highConfidence,
    averageBrightness: Math.round(totalBrightness / fires.length),
    totalFirePower: Math.round(totalFRP),
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Get fire risk level based on fire data
 */
export function getFireRiskLevel(stats: FireStats): {
  level: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
  color: string;
  description: string;
} {
  if (stats.totalFires === 0) {
    return {
      level: 'none',
      color: '#10b981',
      description: 'No active fires detected',
    };
  }

  if (stats.highConfidence >= 10 || stats.totalFires >= 50) {
    return {
      level: 'extreme',
      color: '#dc2626',
      description: 'Extreme fire activity - immediate danger',
    };
  }

  if (stats.highConfidence >= 5 || stats.totalFires >= 20) {
    return {
      level: 'high',
      color: '#f97316',
      description: 'High fire activity - elevated risk',
    };
  }

  if (stats.totalFires >= 10) {
    return {
      level: 'moderate',
      color: '#f59e0b',
      description: 'Moderate fire activity - monitor conditions',
    };
  }

  return {
    level: 'low',
    color: '#eab308',
    description: 'Low fire activity - remain vigilant',
  };
}
