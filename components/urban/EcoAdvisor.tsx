"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, MapPin, Thermometer, Wind, Droplets, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EcoTip {
  category: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  aqi: number;
  aqiLevel: string;
  pm25?: number;
  pm10?: number;
}

export function EcoAdvisor() {
  const { user } = useAuth();
  const [tips, setTips] = useState<EcoTip[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (user) {
      console.log('EcoAdvisor - Logged in user:', user.id);
    } else {
      console.log('EcoAdvisor - No user logged in');
    }

    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Default to a location if permission denied
          setLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi
        }
      );
    } else {
      setLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi
    }
  }, []);

  const fetchEcoTips = async () => {
    if (!location) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/urban/eco-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to generate eco-tips');
        setTips([]);
        setWeather(null);
      } else {
        setTips(data.tips || []);
        setWeather(data.weather || null);
      }
    } catch (err: any) {
      setError(err.message || 'Network error: Failed to fetch eco-tips');
      setTips([]);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'air_quality': return '💨';
      case 'energy': return '⚡';
      case 'water': return '💧';
      case 'transport': return '🚗';
      case 'waste': return '♻️';
      default: return '🌱';
    }
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 1) return 'text-green-600 bg-green-50 border-green-200';
    if (aqi <= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (aqi <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (aqi <= 4) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-purple-600 bg-purple-50 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                AI Eco-Advisor
              </CardTitle>
              <CardDescription>
                Personalized eco-tips based on your location and weather
              </CardDescription>
            </div>
            <Button
              onClick={fetchEcoTips}
              disabled={loading || !location}
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Get Today's Tips
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Weather Context */}
      {weather && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Current Conditions - {weather.city}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{weather.temp.toFixed(1)}°C</p>
                  <p className="text-xs text-muted-foreground">{weather.condition}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{weather.humidity}%</p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">AQI {weather.aqi}</p>
                  <p className="text-xs text-muted-foreground">{weather.aqiLevel}</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${getAQIColor(weather.aqi)}`}>
                <p className="text-xs font-medium">Air Quality</p>
                <p className="text-lg font-bold">{weather.aqiLevel}</p>
                {weather.pm25 && (
                  <p className="text-xs">PM2.5: {weather.pm25.toFixed(1)} μg/m³</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Eco-Tips */}
      {tips.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(tip.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <Badge className={`${getPriorityColor(tip.priority)} text-white mt-1`}>
                        {tip.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tip.content}</p>
                <p className="text-xs text-muted-foreground mt-3 capitalize">
                  Category: {tip.category.replace('_', ' ')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tips.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-yellow-600 opacity-50" />
            <p className="text-lg font-medium mb-2">Ready to Get Your Daily Eco-Tips?</p>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Get Today's Tips" to receive personalized sustainability advice based on your location and current weather conditions.
            </p>
            <Button onClick={fetchEcoTips} disabled={!location}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
