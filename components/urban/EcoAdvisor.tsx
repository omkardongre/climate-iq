"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, MapPin, Thermometer, Wind, Droplets, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

interface EcoTip {
  category: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface LocalInitiative {
  title: string;
  category: string;
  description: string;
  actionable: string;
  link: string;
  scope?: string; // 'city' or 'country'
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
  const [initiatives, setInitiatives] = useState<LocalInitiative[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [loadingInitiatives, setLoadingInitiatives] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string; country?: string } | null>(null);

  useEffect(() => {
    // Get user location with reverse geocoding
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Try to get city/country from saved location first
          const savedLocation = localStorage.getItem('climateIQ-location');
          if (savedLocation) {
            try {
              const locationData = JSON.parse(savedLocation);
              setLocation({
                ...coords,
                city: locationData.name || locationData.city,
                country: locationData.country
              });
              return;
            } catch (e) {
              // Continue without city for now
            }
          }

          // Set coordinates only, city will be extracted from eco-advisor API
          setLocation(coords);
        },
        (error) => {
          // Default to stored location or Delhi
          const savedLocation = localStorage.getItem('climateIQ-location');
          if (savedLocation) {
            try {
              const locationData = JSON.parse(savedLocation);
              setLocation({ 
                lat: 28.6139, 
                lng: 77.2090, 
                city: locationData.name || locationData.city || 'Delhi', 
                country: locationData.country || 'India' 
              });
            } catch (e) {
              setLocation({ lat: 28.6139, lng: 77.2090, city: 'Delhi', country: 'India' });
            }
          } else {
            setLocation({ lat: 28.6139, lng: 77.2090, city: 'Delhi', country: 'India' });
          }
        }
      );
    }
  }, []);

  const fetchEcoTips = async () => {
    if (!location) {
      setError('Location not available');
      return;
    }

    setLoadingTips(true);
    setError('');

    try {
      // Fetch weather-based eco-tips ONLY
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
        
        // Extract city and country from weather response
        if (data.weather?.city) {
          const savedLocation = localStorage.getItem('climateIQ-location');
          let country = 'India';
          
          if (savedLocation) {
            try {
              const locationData = JSON.parse(savedLocation);
              country = locationData.country || 'India';
            } catch (e) {
              // Use default
            }
          }
          
          // Update location with city from API
          setLocation(prev => ({
            ...prev!,
            city: data.weather.city,
            country: country
          }));
        }
      }

    } catch (err: any) {
      setError(err.message || 'Network error: Failed to fetch eco-tips');
      setTips([]);
      setWeather(null);
    } finally {
      setLoadingTips(false);
    }
  };

  const fetchLocalInitiatives = async () => {
    if (!location) {
      setError('Location not available');
      return;
    }

    if (!location.city || !location.country) {
      setError('City information not available. Please click "Get Today\'s Tips" first to detect your city.');
      return;
    }

    setLoadingInitiatives(true);
    setError('');

    try {
      // Fetch local initiatives with city and country
      const initResponse = await fetch('/api/urban/local-initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: location.city,
          country: location.country,
        }),
      });

      const initData = await initResponse.json();
      setInitiatives(initData.initiatives || []);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch initiatives');
    } finally {
      setLoadingInitiatives(false);
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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport': return 'bg-blue-500';
      case 'waste': return 'bg-green-500';
      case 'energy': return 'bg-yellow-500';
      case 'community': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitiativeCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport': return '🚆';
      case 'waste': return '♻️';
      case 'energy': return '⚡';
      case 'community': return '🤝';
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
                {location?.city && location?.country && (
                  <span className="block mt-1 text-xs">
                    📍 {location.city}, {location.country}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchEcoTips}
                disabled={loadingTips || !location}
                size="sm"
              >
                {loadingTips ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Get Today's Tips
                  </>
                )}
              </Button>
              <Button
                onClick={fetchLocalInitiatives}
                disabled={loadingInitiatives || !location || !location.city}
                variant="outline"
                size="sm"
              >
                {loadingInitiatives ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Discover Initiatives
                  </>
                )}
              </Button>
            </div>
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
            <h3 className="text-xl font-semibold flex items-center gap-2 text-yellow-700">
              💡 Today's Eco-Tips
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-yellow-300">
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
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer between sections */}
      {tips.length > 0 && initiatives.length > 0 && (
        <div className="py-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>
      )}

      {/* Local Initiatives */}
      {initiatives.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
            <h3 className="text-xl font-semibold flex items-center gap-2 text-green-700">
              🌳 Green Initiatives in {location?.city}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
          </div>
          
          {/* City-specific initiatives */}
          {initiatives.filter(i => i.scope === 'city').length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700">
                  🏙️ City Programs
                </Badge>
                <p className="text-xs text-muted-foreground">Available in {location?.city}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {initiatives
                  .filter(i => i.scope === 'city')
                  .map((initiative, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getInitiativeCategoryIcon(initiative.category)}</span>
                              <div>
                                <CardTitle className="text-lg">{initiative.title}</CardTitle>
                                <Badge className={`${getCategoryColor(initiative.category)} text-white mt-1`}>
                                  {initiative.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{initiative.description}</p>
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-1">✅ Action:</p>
                            <p className="text-sm text-muted-foreground">{initiative.actionable}</p>
                          </div>
                          {initiative.link !== 'Contact local municipality' && (
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <a href={initiative.link} target="_blank" rel="noopener noreferrer">
                                Learn More →
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Country-level programs */}
          {initiatives.filter(i => i.scope === 'country').length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                  🇮🇳 National Programs
                </Badge>
                <p className="text-xs text-muted-foreground">Available across {location?.country}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {initiatives
                  .filter(i => i.scope === 'country')
                  .map((initiative, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 bg-gradient-to-br from-green-50 to-white">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getInitiativeCategoryIcon(initiative.category)}</span>
                              <div>
                                <CardTitle className="text-lg">{initiative.title}</CardTitle>
                                <Badge className={`${getCategoryColor(initiative.category)} text-white mt-1`}>
                                  {initiative.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{initiative.description}</p>
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-1">✅ Action:</p>
                            <p className="text-sm text-muted-foreground">{initiative.actionable}</p>
                          </div>
                          {initiative.link !== 'Contact local municipality' && (
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <a href={initiative.link} target="_blank" rel="noopener noreferrer">
                                Learn More →
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loadingTips && !loadingInitiatives && !error && tips.length === 0 && initiatives.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-yellow-600 opacity-50" />
            <p className="text-lg font-medium mb-2">Ready to Get Started?</p>
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized eco-tips based on weather, or discover local green initiatives in {location?.city || 'your area'}.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchEcoTips} disabled={!location}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Get Today's Tips
              </Button>
              <Button onClick={fetchLocalInitiatives} disabled={!location || !location.city} variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Discover Initiatives
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
