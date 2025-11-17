// OpenWeather API Service - Handles both weather and air pollution data
import { checkAPILimit, recordAPICall, RATE_LIMIT_MESSAGES } from './api-limiter'

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  description: string
  feelsLike: number
}

export interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  co: number
  no2: number
  o3: number
  so2: number
}

export interface ClimateData {
  location: string
  date: string
  temperature: number
  air_quality: number
  predictions: {
    temperature_trend: number
    air_quality_trend: number
    precipitation_probability: number
  }
  source: string
}

class OpenWeatherService {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/2.5'

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || ''
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const { allowed, remaining } = checkAPILimit('openweather')
    
    if (!allowed) {
      throw new Error(RATE_LIMIT_MESSAGES.openweather)
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()
      recordAPICall('openweather')

      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        description: data.weather[0].description,
        feelsLike: data.main.feels_like
      }
    } catch (error) {
      console.error('Weather API error:', error)
      throw error
    }
  }

  async getAirPollution(lat: number, lon: number): Promise<AirQualityData> {
    const { allowed, remaining } = checkAPILimit('openweather')
    
    if (!allowed) {
      throw new Error(RATE_LIMIT_MESSAGES.openweather)
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Air pollution API error: ${response.statusText}`)
      }

      const data = await response.json()
      recordAPICall('openweather')

      const pollution = data.list[0]
      
      return {
        aqi: pollution.main.aqi * 20, // Convert to 0-100 scale (OpenWeather uses 1-5)
        pm25: pollution.components.pm2_5,
        pm10: pollution.components.pm10,
        co: pollution.components.co,
        no2: pollution.components.no2,
        o3: pollution.components.o3,
        so2: pollution.components.so2
      }
    } catch (error) {
      console.error('Air pollution API error:', error)
      throw error
    }
  }

  async getOneCallData(lat: number, lon: number): Promise<ClimateData> {
    const { allowed, remaining } = checkAPILimit('openweather')
    
    if (!allowed) {
      throw new Error(RATE_LIMIT_MESSAGES.openweather)
    }

    try {
      // Use OneCall 3.0 API for comprehensive data
      const response = await fetch(
        `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&exclude=minutely,alerts`
      )

      if (!response.ok) {
        throw new Error(`OneCall API error: ${response.statusText}`)
      }

      const data = await response.json()
      recordAPICall('openweather')

      // Get air pollution data separately
      const airQuality = await this.getAirPollution(lat, lon)

      return {
        location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        date: new Date().toISOString(),
        temperature: data.current.temp,
        air_quality: airQuality.aqi,
        predictions: {
          temperature_trend: data.daily[1].temp.day - data.current.temp,
          air_quality_trend: Math.random() * 10 - 5, // Mock trend for air quality
          precipitation_probability: data.daily[0].pop * 100
        },
        source: 'OpenWeather OneCall 3.0'
      }
    } catch (error) {
      console.error('OneCall API error:', error)
      throw error
    }
  }

  // Get forecast data for charts
  async getForecastData(lat: number, lon: number) {
    const { allowed, remaining } = checkAPILimit('openweather')
    
    if (!allowed) {
      throw new Error(RATE_LIMIT_MESSAGES.openweather)
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      )

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.statusText}`)
      }

      const data = await response.json()
      recordAPICall('openweather')

      return data.list.slice(0, 5).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        description: item.weather[0].description
      }))
    } catch (error) {
      console.error('Forecast API error:', error)
      throw error
    }
  }

  // Check remaining API calls
  getRemainingCalls(): number {
    const { remaining } = checkAPILimit('openweather')
    return remaining
  }
}

export const openWeatherService = new OpenWeatherService()
