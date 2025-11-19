"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Sprout, TrendingUp, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CropRecommendation {
  cropName: string;
  successRate: number;
  yieldEstimate: string;
  waterNeeds: string;
  plantingTime: string;
  harvestTime: string;
  benefits: string[];
  challenges: string[];
}

export function CropPlanner() {
  const [location, setLocation] = useState({ lat: '', lon: '', name: '' });
  const [farmSize, setFarmSize] = useState('');
  const [soilType, setSoilType] = useState('');
  const [currentCrop, setCurrentCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [soilData, setSoilData] = useState<any>(null);
  const [weatherSummary, setWeatherSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toFixed(4),
            lon: position.coords.longitude.toFixed(4),
            name: 'Current Location',
          });
        },
        (error) => {
          setError('Unable to get location. Please enter manually.');
        }
      );
    }
  };

  const handleGetRecommendations = async () => {
    if (!location.lat || !location.lon || !farmSize || !soilType) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/agriculture/crop-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          farmSize: parseFloat(farmSize),
          soilType,
          currentCrop,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setSoilData(data.soilData);
      setWeatherSummary(data.weatherSummary);
    } catch (err: any) {
      setError(err.message || 'Failed to get crop recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Details</CardTitle>
          <CardDescription>
            Enter your farm location and details to get personalized crop recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Latitude"
                value={location.lat}
                onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Longitude"
                value={location.lon}
                onChange={(e) => setLocation({ ...location, lon: e.target.value })}
                className="flex-1"
              />
              <Button onClick={handleGetLocation} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
            </div>
            {location.name && (
              <p className="text-sm text-muted-foreground">📍 {location.name}</p>
            )}
          </div>

          {/* Farm Size */}
          <div className="space-y-2">
            <Label htmlFor="farmSize">Farm Size (acres) *</Label>
            <Input
              id="farmSize"
              type="number"
              placeholder="e.g., 10"
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
            />
          </div>

          {/* Soil Type */}
          <div className="space-y-2">
            <Label htmlFor="soilType">Soil Type *</Label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger>
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clay">Clay</SelectItem>
                <SelectItem value="sandy">Sandy</SelectItem>
                <SelectItem value="loamy">Loamy</SelectItem>
                <SelectItem value="silty">Silty</SelectItem>
                <SelectItem value="peaty">Peaty</SelectItem>
                <SelectItem value="chalky">Chalky</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Crop (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="currentCrop">Current/Previous Crop (Optional)</Label>
            <Input
              id="currentCrop"
              placeholder="e.g., Wheat, Rice, Corn"
              value={currentCrop}
              onChange={(e) => setCurrentCrop(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={handleGetRecommendations} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sprout className="mr-2 h-5 w-5" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      {(weatherSummary || soilData) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weatherSummary && (
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">🌤️ Weather Data</h4>
                  <div className="space-y-1 text-sm">
                    <p>Temperature: {weatherSummary.temperature}°C</p>
                    <p>Humidity: {weatherSummary.humidity}%</p>
                    <p>Rainfall (24h): {weatherSummary.rainfall.toFixed(1)}mm</p>
                    <p>Condition: {weatherSummary.condition}</p>
                  </div>
                </div>
              )}
              {soilData && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">🌍 Soil Data</h4>
                  {soilData.message ? (
                    <div className="text-sm text-muted-foreground">
                      <p>{soilData.message}</p>
                      <p className="mt-1">Using your selected soil type: <span className="font-semibold">{soilType}</span></p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <p>pH Level: {soilData.ph}</p>
                      <p>Nitrogen: {soilData.nitrogen} cg/kg</p>
                      <p>Organic Carbon: {soilData.organicCarbon} g/kg</p>
                      <p>Clay: {soilData.clay}% | Sand: {soilData.sand}% | Silt: {soilData.silt}%</p>
                      <p className="text-xs text-muted-foreground mt-2">📡 From SoilGrids satellite</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Recommended Crops for Your Farm</h3>
          {recommendations.map((crop, idx) => (
            <Card key={idx} className="border-2 border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-green-600" />
                    {crop.cropName}
                  </CardTitle>
                  <Badge variant={crop.successRate >= 80 ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                    {crop.successRate}% Success Rate
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Yield Estimate
                    </div>
                    <p className="font-semibold">{crop.yieldEstimate}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Droplets className="h-4 w-4" />
                      Water Needs
                    </div>
                    <p className="font-semibold">{crop.waterNeeds}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Planting Time</div>
                    <p className="font-semibold">{crop.plantingTime}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Harvest Time</div>
                    <p className="font-semibold">{crop.harvestTime}</p>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">✓ Benefits</h4>
                  <ul className="space-y-1">
                    {crop.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Challenges */}
                {crop.challenges.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-700">⚠ Considerations</h4>
                    <ul className="space-y-1">
                      {crop.challenges.map((challenge, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
