/**
 * Temperature Anomaly Service
 * Compares current temperature with historical averages
 */

interface TemperatureAnomalyData {
  currentTemp: number;
  historicalAvg: number;
  anomaly: number; // difference from average
  anomalyPercent: number;
  trend: 'cooler' | 'normal' | 'warmer' | 'much_warmer';
  color: string;
  description: string;
  climateImpact: string;
}

export async function getTemperatureAnomaly(lat: number, lon: number): Promise<TemperatureAnomalyData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }

  try {
    // Get current weather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.statusText}`);
    }

    const data = await response.json();
    const currentTemp = data.main.temp;
    
    // Calculate historical average based on latitude and month
    // This is a simplified model - real system would use actual historical data
    const month = new Date().getMonth(); // 0-11
    const absLat = Math.abs(lat);
    
    // Base temperature by latitude
    let baseTemp = 25 - (absLat * 0.6); // Rough approximation
    
    // Seasonal adjustment (Northern hemisphere)
    const seasonalAdjustment = [
      -8, -6, -2, 4, 10, 14,  // Jan-Jun
      16, 15, 10, 4, -2, -6   // Jul-Dec
    ];
    
    // Adjust for southern hemisphere
    const adjustment = lat < 0 
      ? seasonalAdjustment[(month + 6) % 12]
      : seasonalAdjustment[month];
    
    const historicalAvg = baseTemp + adjustment;
    
    // Calculate anomaly
    const anomaly = currentTemp - historicalAvg;
    const anomalyPercent = (anomaly / historicalAvg) * 100;
    
    // Determine trend
    let trend: 'cooler' | 'normal' | 'warmer' | 'much_warmer';
    let color: string;
    let description: string;
    let climateImpact: string;
    
    if (anomaly < -3) {
      trend = 'cooler';
      color = '#3b82f6'; // blue
      description = `${Math.abs(anomaly).toFixed(1)}°C cooler than average`;
      climateImpact = 'Below normal temperatures. Possible cold weather impacts.';
    } else if (anomaly < 1) {
      trend = 'normal';
      color = '#22c55e'; // green
      description = 'Near normal temperatures';
      climateImpact = 'Temperatures within expected range for this time of year.';
    } else if (anomaly < 3) {
      trend = 'warmer';
      color = '#f97316'; // orange
      description = `${anomaly.toFixed(1)}°C warmer than average`;
      climateImpact = 'Above normal temperatures. Monitor heat-related risks.';
    } else {
      trend = 'much_warmer';
      color = '#dc2626'; // red
      description = `${anomaly.toFixed(1)}°C warmer than average`;
      climateImpact = 'Significantly above normal. Heat wave conditions possible.';
    }
    
    return {
      currentTemp: Math.round(currentTemp * 10) / 10,
      historicalAvg: Math.round(historicalAvg * 10) / 10,
      anomaly: Math.round(anomaly * 10) / 10,
      anomalyPercent: Math.round(anomalyPercent * 10) / 10,
      trend,
      color,
      description,
      climateImpact,
    };
  } catch (error) {
    console.error('Temperature anomaly error:', error);
    throw error;
  }
}
