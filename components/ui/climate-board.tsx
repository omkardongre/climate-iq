"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  MapPin, 
  RefreshCw,
  AlertTriangle,
  Shield,
  Route,
  TrendingDown,
  TrendingUp,
  Minus,
  Loader2
} from 'lucide-react'
import { saveLocation } from '@/lib/location-storage'
import LocationDetector from "@/components/ui/location-detector";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Progress } from "@radix-ui/react-progress";

interface ClimateAlert {
  type: "health" | "environmental" | "safety";
  severity: "low" | "moderate" | "high";
  title: string;
  description: string;
  icon: string;
}

interface ClimateData {
  location: string;
  date: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  weather_description: string;
  weather_icon: string;
  air_quality: number;
  uv_index?: number;
  air_quality_components: {
    pm2_5: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  } | null;
  predictions: {
    temperature_trend: number;
    air_quality_trend: number;
    precipitation_probability: number;
  };
  hourly_forecast: Array<{
    time: string;
    temp: number;
    feels_like: number;
    humidity: number;
    precipitation: number;
    weather: string;
    icon: string;
  }>;
  daily_forecast: Array<{
    day: string;
    date: string;
    temp_high: number;
    temp_low: number;
    precipitation: number;
    weather: string;
    icon: string;
  }>;
  source: string;
}

interface ClimateBoardProps {
  location?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}

export function ClimateBoard({ location }: ClimateBoardProps) {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    city: string;
    country: string;
    lat: number;
    lon: number;
  } | null>(null);
  const [showLocationDetector, setShowLocationDetector] = useState(false); // Start with false to prevent initial flash
  const [hasInitialized, setHasInitialized] = useState(false);
  const [climateAlerts, setClimateAlerts] = useState<ClimateAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const alertsRequestRef = useRef<string | null>(null); // Track ongoing requests

  // Cache management functions
  const getCacheKey = (lat: number, lon: number) => `weather_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  const getCachedWeatherData = (lat: number, lon: number) => {
    try {
      const cacheKey = getCacheKey(lat, lon);
      console.log(`Checking cache for key: ${cacheKey}`);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const age = Math.round((now - timestamp) / 1000 / 60); // age in minutes
        console.log(`Cache found, age: ${age} minutes`);
        if (now - timestamp < CACHE_DURATION) {
          console.log('✅ Using cached weather data - no API call needed');
          return data;
        } else {
          console.log('❌ Cache expired, removing old data');
          localStorage.removeItem(cacheKey);
        }
      } else {
        console.log('❌ No cache found');
      }
    } catch (error) {
      console.error('Error reading weather cache:', error);
    }
    return null;
  };

  const setCachedWeatherData = (lat: number, lon: number, data: any) => {
    try {
      const cacheKey = getCacheKey(lat, lon);
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`✅ Weather data cached successfully with key: ${cacheKey}`);
    } catch (error) {
      console.error('Error caching weather data:', error);
    }
  };

  const fetchWeatherData = async (lat: number, lon: number, forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cachedData = getCachedWeatherData(lat, lon);
      if (cachedData) {
        setClimateData(cachedData);
        setShowLocationDetector(false);
        fetchClimateAlerts(cachedData);
        setLoading(false);
        return;
      }
    }

    console.log(`🌐 Fetching fresh weather data from API for ${lat}, ${lon}`);
    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
        }),
      });

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the fresh data
      setCachedWeatherData(lat, lon, data);
      
      setClimateData(data);
      setShowLocationDetector(false); // Hide location detector once we have data

      // Fetch AI-powered climate alerts based on weather data
      fetchClimateAlerts(data);
    } catch (err: any) {
      console.error("Failed to fetch weather data:", err);
      setError(err.message || "Failed to fetch weather data");

      const mockData: ClimateData = {
        location: currentLocation?.city || "Alice Springs",
        date: new Date().toISOString(),
        temperature: 28,
        feels_like: 32,
        humidity: 75,
        pressure: 1013,
        wind_speed: 3.2,
        wind_direction: 180,
        visibility: 8,
        weather_description: "partly cloudy",
        weather_icon: "02d",
        air_quality: 3,
        air_quality_components: {
          pm2_5: 35.5,
          pm10: 48.2,
          no2: 25.1,
          o3: 45.3,
          co: 0.8,
        },
        predictions: {
          temperature_trend: 1.2,
          air_quality_trend: -5,
          precipitation_probability: 25,
        },
        hourly_forecast: [],
        daily_forecast: [],
        source: "Fallback Data",
      };
      setClimateData(mockData);
      setShowLocationDetector(false);
    } finally {
      setLoading(false);
    }
  };

  // Initialize with default location on first load
  useEffect(() => {
    if (!hasInitialized && !currentLocation) {
      console.log("🚀 Initializing with default location");
      const defaultLocation = {
        city: "Alice Springs",
        country: "NT",
        lat: -23.6980,
        lon: 133.8807,
      };
      setCurrentLocation(defaultLocation);
      fetchWeatherData(defaultLocation.lat, defaultLocation.lon, false); // Don't force refresh on init
      setHasInitialized(true);
    }
  }, [hasInitialized, currentLocation]);

  const handleLocationChange = (locationData: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  }) => {
    console.log("ClimateBoard: Location changed to:", locationData);
    
    // Check if this is actually a new location
    const isNewLocation = !currentLocation || 
      Math.abs(currentLocation.lat - locationData.lat) > 0.01 || 
      Math.abs(currentLocation.lon - locationData.lon) > 0.01;
    
    setCurrentLocation(locationData);
    setShowLocationDetector(false); // Hide location detector after selection
    
    // Save location to browser storage for other features (like bushfire risk)
    saveLocation({
      name: `${locationData.city}, ${locationData.country}`,
      coordinates: {
        lat: locationData.lat,
        lng: locationData.lon
      },
      timestamp: Date.now()
    });
    
    // Only force refresh for genuinely new locations
    if (isNewLocation) {
      console.log("🔄 New location detected, forcing fresh API call");
      fetchWeatherData(locationData.lat, locationData.lon, true);
    } else {
      console.log("📍 Same location, using cache if available");
      fetchWeatherData(locationData.lat, locationData.lon, false);
    }
  };

  const handleChangeLocationClick = () => {
    console.log("ClimateBoard: Change location clicked");
    setShowLocationDetector(true);
    setError(null); // Clear any previous errors
  };

  const handleLocationSelect = (newLocation: string) => {
    setCurrentLocation({
      city: newLocation,
      country: "",
      lat: 0,
      lon: 0,
    });
    fetchWeatherData(0, 0);
    
    // Save location to browser storage for chat integration
    saveLocation({
      name: newLocation,
      timestamp: Date.now()
    });
  };

  const handleLocationError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

  // Cache climate alerts too
  const getAlertsCacheKey = (weatherData: ClimateData) => 
    `alerts_${weatherData.temperature}_${weatherData.air_quality}_${weatherData.humidity}`;

  const getCachedAlerts = (weatherData: ClimateData) => {
    try {
      const cacheKey = getAlertsCacheKey(weatherData);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { alerts, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
          console.log('✅ Using cached climate alerts - no AI API call needed');
          return alerts;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading alerts cache:', error);
    }
    return null;
  };

  const setCachedAlerts = (weatherData: ClimateData, alerts: ClimateAlert[]) => {
    try {
      const cacheKey = getAlertsCacheKey(weatherData);
      const cacheData = { alerts, timestamp: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('✅ Climate alerts cached successfully');
    } catch (error) {
      console.error('Error caching alerts:', error);
    }
  };

  // Fetch AI-powered climate alerts based on weather data
  const fetchClimateAlerts = async (weatherData: ClimateData) => {
    // Create a unique request ID to prevent duplicate calls
    const requestId = `${weatherData.temperature}_${weatherData.humidity}_${Date.now()}`;
    
    // Check if we already have an ongoing request for similar data
    if (alertsRequestRef.current === requestId) {
      console.log('🔄 Duplicate climate alerts request blocked');
      return;
    }
    
    alertsRequestRef.current = requestId;
    setAlertsLoading(true);
    
    // Check cache first
    const cachedAlerts = getCachedAlerts(weatherData);
    if (cachedAlerts) {
      setClimateAlerts(cachedAlerts);
      setAlertsLoading(false);
      alertsRequestRef.current = null;
      return;
    }

    console.log('🤖 Fetching fresh climate alerts from AI API');
    try {
      const response = await fetch("/api/climate-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weatherData: {
            temperature: weatherData.temperature,
            feels_like: weatherData.feels_like,
            air_quality: weatherData.air_quality,
            humidity: weatherData.humidity,
            wind_speed: weatherData.wind_speed,
            pressure: weatherData.pressure,
            visibility: weatherData.visibility,
            uv_index: weatherData.uv_index,
            location: weatherData.location,
            forecast: weatherData.daily_forecast?.slice(0, 3).map((day) => ({
              temp_min: day.temp_low,
              temp_max: day.temp_high,
              description: day.weather,
            })),
          },
        }),
      });

      if (response.ok) {
        const alertsData = await response.json();
        const alerts = alertsData.alerts || [];
        setClimateAlerts(alerts);
        // Cache the fresh alerts
        setCachedAlerts(weatherData, alerts);
      } else {
        console.error("Failed to fetch climate alerts:", response.statusText);
        // Set fallback alerts
        setClimateAlerts([
          {
            type: "environmental",
            severity: "moderate",
            title: "Weather Monitoring",
            description:
              "Stay informed about current weather conditions and adjust your daily activities accordingly.",
            icon: "AlertTriangle",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching climate alerts:", error);
      // Set fallback alerts
      setClimateAlerts([
        {
          type: "environmental",
          severity: "low",
          title: "General Advisory",
          description:
            "Monitor weather conditions and plan your activities accordingly.",
          icon: "AlertTriangle",
        },
      ]);
    } finally {
      setAlertsLoading(false);
      alertsRequestRef.current = null; // Clear the request reference
    }
  };

  // Generate real hourly temperature data from API or realistic fallback
  const getTemperatureChartData = () => {
    if (
      climateData?.hourly_forecast &&
      climateData.hourly_forecast.length > 0
    ) {
      return climateData.hourly_forecast.map((hour) => ({
        time: hour.time,
        temp: hour.temp,
        feels_like: Math.round(hour.temp + (hour.humidity > 80 ? 3 : 1)), // Calculate feels like based on humidity
      }));
    }

    // Generate realistic hourly data based on current temperature
    const currentTemp = climateData?.temperature || 22;
    const baseTemp = currentTemp;
    const hourlyData = [];

    for (let i = 0; i < 24; i += 3) {
      const hour = String(i).padStart(2, "0") + ":00";
      // Simulate daily temperature variation
      let tempVariation = 0;
      if (i >= 6 && i <= 18) {
        // Daytime - warmer
        tempVariation = Math.sin(((i - 6) * Math.PI) / 12) * 6;
      } else {
        // Nighttime - cooler
        tempVariation = -3;
      }

      hourlyData.push({
        time: hour,
        temp: Math.round(baseTemp + tempVariation),
        feels_like: Math.round(baseTemp + tempVariation + 2),
      });
    }

    return hourlyData;
  };

  // Generate weekly air quality data from current AQI
  const getWeeklyAirQualityDataReal = () => {
    if (climateData?.air_quality_components) {
      // Use real air quality data to generate weekly trend
      const baseAqi = climateData.air_quality || 2;
      const basePm25 = climateData.air_quality_components.pm2_5 || 15;

      return [
        {
          day: "Mon",
          aqi: Math.max(1, baseAqi - 1),
          pm25: Math.max(5, Math.round(basePm25 - 3)),
        },
        { day: "Tue", aqi: baseAqi, pm25: Math.round(basePm25) },
        {
          day: "Wed",
          aqi: Math.min(5, baseAqi + 1),
          pm25: Math.round(basePm25 + 2),
        },
        { day: "Thu", aqi: baseAqi, pm25: Math.round(basePm25 - 1) },
        {
          day: "Fri",
          aqi: Math.max(1, baseAqi - 1),
          pm25: Math.max(5, Math.round(basePm25 - 2)),
        },
        { day: "Sat", aqi: baseAqi, pm25: Math.round(basePm25 + 1) },
        {
          day: "Sun",
          aqi: Math.min(5, baseAqi + 1),
          pm25: Math.round(basePm25 + 3),
        },
      ];
    }
    // Fallback data with realistic values
    return [
      { day: "Mon", aqi: 2, pm25: 25 },
      { day: "Tue", aqi: 3, pm25: 35 },
      { day: "Wed", aqi: 2, pm25: 20 },
      { day: "Thu", aqi: 4, pm25: 45 },
      { day: "Fri", aqi: 2, pm25: 30 },
      { day: "Sat", aqi: 1, pm25: 15 },
      { day: "Sun", aqi: 2, pm25: 25 },
    ];
  };

  const temperatureData = getTemperatureChartData();
  const airQualityData = getWeeklyAirQualityDataReal();

  const climateImpactData = [
    { category: "Transport", impact: 35, color: "#ef4444" },
    { category: "Energy", impact: 28, color: "#f97316" },
    { category: "Food", impact: 22, color: "#eab308" },
    { category: "Waste", impact: 15, color: "#22c55e" },
  ];

  // Calculate personal impact based on real climate data
  const getPersonalImpactData = () => {
    if (!climateData) return climateImpactData;

    // Adjust impact based on climate conditions
    const temp = climateData.temperature || 22;
    const aqi = climateData.air_quality || 2;
    const humidity = climateData.humidity || 65;

    // Higher temperatures increase cooling energy needs
    const energyMultiplier = temp > 30 ? 1.3 : temp < 10 ? 1.2 : 1.0;

    // Poor air quality increases transport impact (more indoor time, delivery usage)
    const transportMultiplier = aqi > 3 ? 1.2 : 1.0;

    // High humidity affects food preservation and waste
    const foodMultiplier = humidity > 80 ? 1.1 : 1.0;

    return [
      {
        category: "Transport",
        impact: Math.round(35 * transportMultiplier),
        color: "#ef4444",
      },
      {
        category: "Energy",
        impact: Math.round(28 * energyMultiplier),
        color: "#f97316",
      },
      {
        category: "Food",
        impact: Math.round(22 * foodMultiplier),
        color: "#eab308",
      },
      { category: "Waste", impact: 15, color: "#22c55e" },
    ];
  };

  // Calculate daily CO2 footprint based on climate data
  const calculateDailyCO2 = () => {
    if (!climateData) return 12.5;

    const temp = climateData.temperature || 22;
    const aqi = climateData.air_quality || 2;

    // Base CO2 footprint (kg per day)
    let dailyCO2 = 12.5;

    // Temperature impact on energy usage
    if (temp > 30) dailyCO2 += 2.5; // AC usage
    else if (temp < 10) dailyCO2 += 2.0; // Heating

    // Air quality impact (poor AQ = more indoor activities, deliveries)
    if (aqi > 3) dailyCO2 += 1.5;

    return Math.round(dailyCO2 * 10) / 10;
  };

  // Generate climate goals based on local conditions
  const getClimateGoals = () => {
    if (!climateData) {
      return [
        {
          title: "Reduce Transport Emissions",
          progress: 65,
          description: "Use public transport or cycling",
        },
        {
          title: "Energy Efficiency",
          progress: 45,
          description: "Optimize heating/cooling usage",
        },
        {
          title: "Waste Reduction",
          progress: 80,
          description: "Reduce, reuse, recycle",
        },
        {
          title: "Sustainable Food",
          progress: 55,
          description: "Choose local, seasonal produce",
        },
      ];
    }

    const temp = climateData.temperature || 22;
    const aqi = climateData.air_quality || 2;
    const location = climateData.location || "Your Location";

    const goals = [];

    // Transport goal based on air quality
    if (aqi > 3) {
      goals.push({
        title: "Reduce Transport Emissions",
        progress: 40,
        description: `Poor air quality in ${
          location.split(",")[0]
        } - consider remote work or public transport`,
      });
    } else {
      goals.push({
        title: "Active Transportation",
        progress: 75,
        description: `Good air quality in ${
          location.split(",")[0]
        } - great for cycling and walking`,
      });
    }

    // Energy goal based on temperature
    if (temp > 30) {
      goals.push({
        title: "Cooling Efficiency",
        progress: 50,
        description: `High temperature (${temp}°C) - optimize AC usage and insulation`,
      });
    } else if (temp < 10) {
      goals.push({
        title: "Heating Efficiency",
        progress: 60,
        description: `Low temperature (${temp}°C) - improve insulation and heating efficiency`,
      });
    } else {
      goals.push({
        title: "Energy Conservation",
        progress: 85,
        description: `Comfortable temperature (${temp}°C) - maintain efficient energy usage`,
      });
    }

    // Weather-based goals
    goals.push({
      title: "Water Conservation",
      progress: climateData.humidity > 70 ? 70 : 45,
      description:
        climateData.humidity > 70
          ? "High humidity - optimize water usage"
          : "Monitor water consumption",
    });

    goals.push({
      title: "Local Climate Action",
      progress: 60,
      description: `Support climate initiatives in ${location.split(",")[0]}`,
    });

    return goals;
  };

  // Calculate overall climate score
  const getClimateScore = () => {
    if (!climateData) return 65;

    let score = 70; // Base score

    // Air quality bonus/penalty
    const aqi = climateData.air_quality || 2;
    if (aqi <= 2) score += 15; // Good air quality
    else if (aqi >= 4) score -= 20; // Poor air quality

    // Temperature efficiency
    const temp = climateData.temperature || 22;
    if (temp >= 18 && temp <= 26) score += 10; // Comfortable range
    else score -= 5; // Extreme temperatures

    // Location bonus (regions with excellent renewable energy potential)
    if (climateData.location) score += 10;

    return Math.max(0, Math.min(100, score));
  };

  const weeklyForecast = [
    {
      day: "Today",
      temp_high: 24,
      temp_low: 16,
      precipitation: 10,
      weather: "Sunny",
    },
    {
      day: "Tomorrow",
      temp_high: 26,
      temp_low: 18,
      precipitation: 20,
      weather: "Partly Cloudy",
    },
    {
      day: "Wed",
      temp_high: 23,
      temp_low: 15,
      precipitation: 40,
      weather: "Cloudy",
    },
    {
      day: "Thu",
      temp_high: 21,
      temp_low: 14,
      precipitation: 60,
      weather: "Rainy",
    },
    {
      day: "Fri",
      temp_high: 25,
      temp_low: 17,
      precipitation: 15,
      weather: "Sunny",
    },
    {
      day: "Sat",
      temp_high: 27,
      temp_low: 19,
      precipitation: 5,
      weather: "Clear",
    },
    {
      day: "Sun",
      temp_high: 24,
      temp_low: 16,
      precipitation: 25,
      weather: "Partly Cloudy",
    },
  ];

  // Remove duplicate function - using the one defined earlier

  // Generate real forecast data from API or realistic fallback
  const getRealForecastData = () => {
    if (climateData?.daily_forecast && climateData.daily_forecast.length > 0) {
      return climateData.daily_forecast.slice(0, 7).map((day) => ({
        day: day.date,
        temp_high: day.high,
        temp_low: day.low,
        precipitation: day.precipitation,
        weather: day.condition,
      }));
    }

    // Generate realistic forecast based on current weather
    if (climateData?.temperature) {
      const currentTemp = climateData.temperature;
      const days = [
        "Today",
        "Tomorrow",
        "Day 3",
        "Day 4",
        "Day 5",
        "Day 6",
        "Day 7",
      ];

      return days.map((day, index) => {
        // Simulate realistic weather patterns
        const tempVariation = (Math.random() - 0.5) * 6; // ±3 degrees
        const temp_high = Math.round(currentTemp + tempVariation + 2);
        const temp_low = Math.round(currentTemp + tempVariation - 3);

        const weatherOptions = [
          "Sunny",
          "Partly Cloudy",
          "Cloudy",
          "Light Rain",
          "Clear",
        ];
        const weather =
          weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

        return {
          day,
          temp_high,
          temp_low,
          precipitation: Math.round(Math.random() * 40),
          weather,
        };
      });
    }

    return weeklyForecast;
  };

  const getAQILevel = (aqi: number) => {
    if (aqi <= 1)
      return {
        level: "Good",
        color: "bg-green-500",
        textColor: "text-green-700",
      };
    if (aqi <= 2)
      return {
        level: "Fair",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
      };
    if (aqi <= 3)
      return {
        level: "Moderate",
        color: "bg-orange-500",
        textColor: "text-orange-700",
      };
    if (aqi <= 4)
      return { level: "Poor", color: "bg-red-500", textColor: "text-red-700" };
    return {
      level: "Very Poor",
      color: "bg-purple-500",
      textColor: "text-purple-700",
    };
  };

  const getAirQualityLabel = (aqi: number) => {
    if (aqi <= 1) return "Good";
    if (aqi <= 2) return "Fair";
    if (aqi <= 3) return "Moderate";
    if (aqi <= 4) return "Poor";
    return "Very Poor";
  };

  // Show location detector when explicitly requested
  if (showLocationDetector) {
    return (
      <div className="space-y-6">
        <LocationDetector
          onLocationChange={handleLocationChange}
          skipInitialDefault={true}
        />
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading climate data...</p>
            </div>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const aqiLevel = getAQILevel(climateData?.air_quality || 0);

  // Add null check for climateData
  if (!climateData) {
    return (
      <div className="space-y-6">
        <LocationDetector onLocationChange={handleLocationChange} />
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No climate data available. Please check your connection and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Location Change Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleChangeLocationClick}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Change Location
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {climateData.location}
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(climateData.date).toLocaleString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {climateData.temperature}°C
              </div>
              <div className="text-sm text-gray-600">
                Feels like {climateData.feels_like}°C
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Temperature
                </p>
                <p className="text-2xl font-bold">
                  {climateData?.temperature}°C
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {(climateData.predictions?.temperature_trend || 0) > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (climateData.predictions?.temperature_trend || 0) < 0 ? (
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                  <span
                    className={`text-sm ${
                      (climateData.predictions?.temperature_trend || 0) > 0
                        ? "text-red-600"
                        : (climateData.predictions?.temperature_trend || 0) < 0
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {(climateData.predictions?.temperature_trend || 0) > 0
                      ? "+"
                      : ""}
                    {climateData.predictions?.temperature_trend || 0}°C trend
                  </span>
                </div>
              </div>
              <Thermometer className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Air Quality
                </p>
                <div className="text-2xl font-bold">
                  {getAirQualityLabel(climateData?.air_quality || 0)}
                </div>
                <Badge
                  variant="secondary"
                  className={`mt-1 ${aqiLevel.color} text-white text-xs`}
                >
                  {aqiLevel.level}
                </Badge>
              </div>
              <Eye className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Humidity
                </p>
                <div className="text-2xl font-bold">
                  {climateData.humidity || 0}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Progress
                    value={climateData.humidity || 0}
                    className="w-16 h-2"
                  />
                </div>
              </div>
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Wind Speed
                </p>
                <p className="text-2xl font-bold">12 km/h</p>
                <p className="text-xs text-gray-500 mt-1">Light breeze</p>
              </div>
              <Wind className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="impact">Personal Impact</TabsTrigger>
          <TabsTrigger value="bushfire">Bushfire Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">24-Hour Temperature</CardTitle>
                <CardDescription>
                  Temperature and feels-like comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#3b82f6"
                      name="Temperature"
                    />
                    <Line
                      type="monotone"
                      dataKey="feels_like"
                      stroke="#ef4444"
                      name="Feels Like"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Air Quality Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Air Quality</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    AQI: 1-5 Scale
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    PM2.5: µg/m³
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={airQualityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="aqi" orientation="left" domain={[0, 5]} />
                    <YAxis
                      yAxisId="pm25"
                      orientation="right"
                      domain={[0, 50]}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "AQI"
                          ? `${value} (${getAirQualityLabel(value as number)})`
                          : `${value} µg/m³`,
                        name,
                      ]}
                    />
                    <Bar
                      yAxisId="aqi"
                      dataKey="aqi"
                      fill="#3b82f6"
                      name="AQI"
                    />
                    <Bar
                      yAxisId="pm25"
                      dataKey="pm25"
                      fill="#ef4444"
                      name="PM2.5"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 space-y-1 mt-2">
                  <p>• AQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor</p>
                  <p>
                    • PM2.5: Fine particles (µg/m³) - WHO guideline: &lt;15
                    µg/m³
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Climate Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Climate Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm text-gray-500">
                    Loading climate alerts...
                  </div>
                </div>
              ) : climateAlerts.length > 0 ? (
                climateAlerts.map((alert, index) => {
                  const getSeverityColor = (severity: string) => {
                    switch (severity) {
                      case "high":
                        return "border-red-200 bg-red-50";
                      case "moderate":
                        return "border-orange-200 bg-orange-50";
                      default:
                        return "border-blue-200 bg-blue-50";
                    }
                  };

                  return (
                    <Alert
                      key={index}
                      className={getSeverityColor(alert.severity)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{alert.title}:</strong> {alert.description}
                      </AlertDescription>
                    </Alert>
                  );
                })
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Weather Monitoring:</strong> Stay informed about
                    current weather conditions and adjust your activities
                    accordingly.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Climate Forecast</CardTitle>
              <CardDescription>
                Real weather predictions from OpenWeather API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRealForecastData().map((day: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{day.day}</div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span className="text-sm">
                          {day.temp_high}° / {day.temp_low}°
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          {day.precipitation}% rain
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {climateData?.wind_speed || 0} m/s
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">{day.weather || "Clear"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Climate Impact</CardTitle>
                <CardDescription>
                  Carbon footprint based on location and weather data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getPersonalImpactData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="impact"
                      label={({ category, impact }) =>
                        `${category}: ${impact}%`
                      }
                    >
                      {getPersonalImpactData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Daily CO2 Footprint:</strong> {calculateDailyCO2()}{" "}
                    kg CO2
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Monthly Estimate:</strong>{" "}
                    {(calculateDailyCO2() * 30).toFixed(1)} kg CO2
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Climate Action Goals</CardTitle>
                <CardDescription>
                  Personalized goals based on your location's climate data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getClimateGoals().map((goal, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{goal.title}</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">
                      {goal.description}
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    Climate Impact Score: {getClimateScore()}/100
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Based on local air quality (
                    {getAirQualityLabel(climateData?.air_quality || 1)}) and
                    weather conditions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bushfire" className="space-y-6">
          <BushfireRiskTab location={currentLocation ? `${currentLocation.city}, ${currentLocation.country}` : 'Alice Springs, NT'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Bushfire Risk Tab Component
function BushfireRiskTab({ location }: { location: string }) {
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchingRef = useRef(false)

  const fetchBushfireRisk = async () => {
    if (fetchingRef.current) return // Prevent duplicate calls
    
    fetchingRef.current = true
    setLoading(true)
    try {
      const response = await fetch('/api/bushfire-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: location || 'Alice Springs, NT' })
      })
      
      if (response.ok) {
        const apiData = await response.json()
        console.log('Bushfire Tab API response:', apiData)
        
        // Transform API response to display format
        const transformedData = {
          riskLevel: apiData.fire_danger_rating || apiData.risk_level || 'moderate',
          riskScore: apiData.risk_score || 50,
          temperature: 35,
          humidity: 20,
          windSpeed: 25,
          location: location,
          recommendations: apiData.safety_recommendations || [],
          evacuationRoutes: apiData.evacuation_routes?.map((route: any) => 
            `${route.route_name}: ${route.description}${route.estimated_time ? ` (Est. time: ${route.estimated_time})` : ''}`
          ) || [],
          fireSafeLandscaping: apiData.fire_safe_landscaping?.map((item: any) => 
            `[${item.priority.toUpperCase()}] ${item.action}: ${item.description}`
          ) || [],
          emergencyContacts: apiData.emergency_contacts || []
        }
        
        console.log('Transformed bushfire data:', transformedData)
        setRiskData(transformedData)
      } else {
        // Fallback to mock data if API fails with location-specific data
        const locationSpecificData = getLocationSpecificData(location || 'Alice Springs, NT')
        setRiskData(locationSpecificData)
      }
    } catch (error) {
      console.error('Error fetching bushfire risk:', error)
      const locationSpecificData = getLocationSpecificData(location || 'Alice Springs, NT')
      setRiskData(locationSpecificData)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const getLocationSpecificData = (loc: string) => {
    const locationData: { [key: string]: any } = {
      'Alice Springs, NT': {
        recommendations: [
          'Monitor fire danger ratings and weather conditions closely',
          'Ensure your bushfire survival plan is up to date',
          'Clear gutters and remove flammable materials from around your home',
          'Check and maintain firefighting equipment'
        ],
        evacuationRoutes: [
          'Stuart Highway south to Adelaide (backup route)',
          'Main Highway 87 towards Darwin (primary route)',
          'Local evacuation center: Alice Springs Convention Centre'
        ]
      },
      'Darwin, NT': {
        recommendations: [
          'Prepare for tropical cyclone season (November-April)',
          'Secure outdoor furniture and equipment',
          'Check emergency supplies and communication devices',
          'Monitor Bureau of Meteorology warnings'
        ],
        evacuationRoutes: [
          'Stuart Highway south to Katherine',
          'Arnhem Highway east to Jabiru',
          'Local evacuation center: Darwin Convention Centre'
        ]
      },
      'Perth, WA': {
        recommendations: [
          'Create defensible space around your property',
          'Install ember guards on vents and windows',
          'Maintain water supply for firefighting',
          'Plan multiple evacuation routes'
        ],
        evacuationRoutes: [
          'Great Eastern Highway east to York',
          'Albany Highway south to Armadale',
          'Local evacuation center: Perth Convention Centre'
        ]
      }
    }

    return {
      riskLevel: 'Very High',
      temperature: 38,
      humidity: 15,
      windSpeed: 25,
      location: loc,
      recommendations: locationData[loc]?.recommendations || locationData['Alice Springs, NT'].recommendations,
      evacuationRoutes: locationData[loc]?.evacuationRoutes || locationData['Alice Springs, NT'].evacuationRoutes
    }
  }

  useEffect(() => {
    if (location) {
      fetchBushfireRisk()
    }
  }, [location])

  const getRiskColor = (level) => {
    const colors = {
      'Low-Moderate': 'bg-green-500',
      'High': 'bg-yellow-500',
      'Very High': 'bg-orange-500',
      'Severe': 'bg-red-500',
      'Extreme': 'bg-purple-500',
      'Catastrophic': 'bg-black'
    }
    return colors[level] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading bushfire risk data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Safety Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Immediate Actions:</h4>
              <ul className="space-y-1 text-sm">
                {(riskData?.recommendations || [
                  'Monitor fire danger ratings closely',
                  'Ensure bushfire survival plan is current',
                  'Clear gutters and remove flammable materials',
                  'Check firefighting equipment'
                ]).slice(0, 4).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Evacuation Routes:</h4>
              <ul className="space-y-1 text-sm">
                {(riskData?.evacuationRoutes || [
                  'Stuart Highway south to Adelaide',
                  'Main Highway 87 towards Darwin',
                  'Local evacuation center: Alice Springs Convention Centre'
                ]).map((route, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{route}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Image Placeholder */}
      <div 
        className="h-48 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center"
        style={{
          backgroundImage: 'url(/images/bushfire-landscape.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Wildfire Risk Assessment</p>
          <p className="text-xs text-gray-600">Powered by AI and real-time weather data</p>
        </div> */}
      </div>
    </div>
  )
}
