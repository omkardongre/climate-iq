"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, MapPin, Sprout, TrendingUp, Droplets, Zap, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [location, setLocation] = useState({ lat: '', lon: '', name: '' });
  const [farmSize, setFarmSize] = useState(10);
  const [soilType, setSoilType] = useState('');
  const [currentCrop, setCurrentCrop] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [soilData, setSoilData] = useState<any>(null);
  const [weatherSummary, setWeatherSummary] = useState<any>(null);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const steps = [
    { icon: MapPin, title: 'Location', emoji: '🗺️', desc: 'Where\'s your farm?' },
    { icon: Sprout, title: 'Farm Details', emoji: '🌱', desc: 'Tell us about your land' },
    { icon: Sparkles, title: 'AI Analysis', emoji: '🤖', desc: 'Finding perfect crops' },
  ];

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
    setLoading(true);
    setError('');
    setCurrentStep(2); // Move to AI Analysis step
    
    try {
      const response = await fetch('/api/agriculture/crop-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          farmSize,
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
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to get crop recommendations');
      setCurrentStep(1); // Go back to farm details
    } finally {
      setLoading(false);
    }
  };

  const canProceed = (step: number) => {
    if (step === 0) return location.lat && location.lon;
    if (step === 1) return farmSize > 0 && soilType;
    return true;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 1) {
        handleGetRecommendations();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6">
      {/* Celebration Effect */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl"
              initial={{ y: -20, x: Math.random() * 100 + '%', opacity: 1 }}
              animate={{ y: '100vh', rotate: 360 }}
              transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.3 }}
            >
              {['🌾', '🌱', '🌻', '🥕'][Math.floor(Math.random() * 4)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* Wizard Card - Hide when results are showing */}
      {recommendations.length === 0 && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-600" />
              AI Crop Planner
            </CardTitle>
            <CardDescription>
              Get personalized crop recommendations powered by AI & real data
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            {currentStep < 2 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          index <= currentStep
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                        animate={{ scale: index === currentStep ? 1.1 : 1 }}
                        transition={{ type: 'spring' }}
                      >
                        {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step.emoji}
                      </motion.div>
                      <span className="text-xs font-medium text-center">{step.title}</span>
                    </div>
                  ))}
                </div>
                <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
              </div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[300px]"
              >
                {/* Step 0: Location */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">📍 {steps[0].desc}</h3>
                      <p className="text-sm text-muted-foreground">We'll analyze soil & weather data for you</p>
                    </div>

                    <Button
                      onClick={handleGetLocation}
                      variant="outline"
                      size="lg"
                      className="w-full h-16 text-lg"
                    >
                      <MapPin className="mr-2 h-5 w-5" />
                      Use My Current Location
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Latitude</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 18.5211"
                          value={location.lat}
                          onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Longitude</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 73.8502"
                          value={location.lon}
                          onChange={(e) => setLocation({ ...location, lon: e.target.value })}
                        />
                      </div>
                    </div>
                    {location.name && (
                      <p className="text-sm text-muted-foreground text-center">✅ {location.name}</p>
                    )}
                  </div>
                )}

                {/* Step 1: Farm Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">🌱 {steps[1].desc}</h3>
                      <p className="text-sm text-muted-foreground">Help us understand your farm better</p>
                    </div>

                    {/* Farm Size Slider */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Farm Size</Label>
                        <Badge variant="secondary" className="text-lg font-bold">
                          {farmSize} acres
                        </Badge>
                      </div>
                      <Slider
                        value={[farmSize]}
                        onValueChange={([value]) => setFarmSize(value)}
                        min={1}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 acre</span>
                        <span>100 acres</span>
                      </div>
                    </div>

                    {/* Soil Type */}
                    <div>
                      <Label className="text-base font-semibold">Soil Type</Label>
                      <Select value={soilType} onValueChange={setSoilType}>
                        <SelectTrigger className="h-12 text-lg">
                          <SelectValue placeholder="Select your soil type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clay">🟤 Clay - Heavy, nutrient-rich</SelectItem>
                          <SelectItem value="sandy">🟡 Sandy - Light, drains fast</SelectItem>
                          <SelectItem value="loamy">🟠 Loamy - Ideal for most crops</SelectItem>
                          <SelectItem value="silty">⚫ Silty - Smooth, fertile</SelectItem>
                          <SelectItem value="peaty">🟢 Peaty - Organic, acidic</SelectItem>
                          <SelectItem value="chalky">⚪ Chalky - Alkaline, stony</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Current Crop (Optional) */}
                    <div>
                      <Label className="text-base">Previous Crop (Optional)</Label>
                      <Input
                        placeholder="e.g., Wheat, Rice, Corn"
                        value={currentCrop}
                        onChange={(e) => setCurrentCrop(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Helps us suggest crop rotation</p>
                    </div>
                  </div>
                )}

                {/* Step 2: AI Analysis Loading */}
                {currentStep === 2 && loading && (
                  <div className="flex flex-col items-center justify-center space-y-6 py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-16 w-16 text-green-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900">🤖 AI is Analyzing...</h3>
                    <div className="space-y-2 text-center">
                      <p className="text-muted-foreground">🌍 Fetching soil data from satellites...</p>
                      <p className="text-muted-foreground">🌤️ Checking weather patterns...</p>
                      <p className="text-muted-foreground">🌱 Finding perfect crops for you...</p>
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-3 bg-green-500 rounded-full"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 2 && (
              <div className="flex gap-3 pt-4 border-t">
                {currentStep > 0 && (
                  <Button onClick={prevStep} variant="outline" className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={nextStep}
                  className="flex-1"
                  disabled={!canProceed(currentStep)}
                >
                  {currentStep === 1 ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Recommendations
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Summary */}
      {(weatherSummary || soilData) && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📊 Analysis Summary
                <Badge variant="secondary" className="ml-auto">Real Data</Badge>
              </CardTitle>
              <CardDescription>Based on satellite & weather data for your location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weatherSummary && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-white/60 backdrop-blur rounded-lg"
                  >
                    <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                      🌤️ Current Weather
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature</span>
                        <span className="font-semibold">{weatherSummary.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Humidity</span>
                        <span className="font-semibold">{weatherSummary.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rainfall (24h)</span>
                        <span className="font-semibold">{weatherSummary.rainfall.toFixed(1)}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="font-semibold">{weatherSummary.condition}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                {soilData && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-white/60 backdrop-blur rounded-lg"
                  >
                    <h4 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                      🌍 Soil Analysis
                    </h4>
                    {soilData.message ? (
                      <div className="text-sm text-muted-foreground">
                        <p>{soilData.message}</p>
                        <p className="mt-2">Using: <span className="font-semibold text-green-700">{soilType}</span></p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">pH Level</span>
                          <span className="font-semibold">{soilData.ph}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nitrogen</span>
                          <span className="font-semibold">{soilData.nitrogen} cg/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Organic Carbon</span>
                          <span className="font-semibold">{soilData.organicCarbon} g/kg</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Composition</span>
                          <span className="font-semibold">
                            Clay: {soilData.clay}% • Sand: {soilData.sand}%
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                📡 Data from SoilGrids satellite & OpenWeather API
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-2xl font-bold">🌾 Perfect Crops for Your Farm</h3>
          <div className="grid gap-4">
            {recommendations.map((crop, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-green-600" />
                        {crop.cropName}
                      </CardTitle>
                      <Badge
                        variant={crop.successRate >= 80 ? 'default' : 'secondary'}
                        className="text-lg px-3 py-1"
                      >
                        {crop.successRate}% Success
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <TrendingUp className="h-4 w-4" />
                          Yield
                        </div>
                        <p className="font-semibold">{crop.yieldEstimate}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Droplets className="h-4 w-4" />
                          Water
                        </div>
                        <p className="font-semibold">{crop.waterNeeds}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Planting</div>
                        <p className="font-semibold">{crop.plantingTime}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Harvest</div>
                        <p className="font-semibold">{crop.harvestTime}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-green-700">✓ Benefits</h4>
                      <ul className="space-y-1">
                        {crop.benefits.map((benefit, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {benefit}</li>
                        ))}
                      </ul>
                    </div>

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
              </motion.div>
            ))}
          </div>

          <Button
            onClick={() => {
              setCurrentStep(0);
              setRecommendations([]);
              setSoilData(null);
              setWeatherSummary(null);
            }}
            variant="outline"
            className="w-full"
          >
            🔄 Plan for Another Location
          </Button>
        </motion.div>
      )}
    </div>
  );
}
