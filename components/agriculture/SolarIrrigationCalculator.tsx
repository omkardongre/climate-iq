"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sun, Loader2, Droplets, MapPin, Zap, Sparkles, TrendingUp, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SolarIrrigationAnalysis {
  solarRadiation: number;
  systemSize: number;
  annualProduction: number;
  pumpPower: number;
  dailyRunHours: number;
  annualSavings: number;
  paybackPeriod: number;
  systemCost: number;
  subsidyAmount: number;
  subsidyPercent?: number;
  subsidyScheme?: string;
  netCost: number;
  twentyYearSavings: number;
  carbonOffset: number;
  location: string;
  country?: string;
}

export function SolarIrrigationCalculator() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [pumpHP, setPumpHP] = useState<number>(5);
  const [hoursPerDay, setHoursPerDay] = useState<number>(6);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [analysis, setAnalysis] = useState<SolarIrrigationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const steps = [
    { icon: MapPin, title: 'Location', emoji: '🗺️' },
    { icon: Zap, title: 'Pump Details', emoji: '⚡' },
    { icon: Sparkles, title: 'AI Magic', emoji: '🤖' },
    { icon: Sun, title: 'Your Savings', emoji: '🎉' },
  ];

  const handleUseMyLocation = async () => {
    setLoadingLocation(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch (err: any) {
      setError('Failed to get your location. Please enter manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setCurrentStep(2); // Move to "AI Magic" step

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid location');
      }

      // Get user's country
      let userCountry = 'India';
      const savedLocation = localStorage.getItem('climateIQ-location');
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          userCountry = locationData.country || locationData.name || 'India';
        } catch (e) {
          console.log('Could not parse location data');
        }
      }

      const response = await fetch(
        `/api/agriculture/solar-irrigation?lat=${lat}&lon=${lng}&pumpHP=${pumpHP}&hoursPerDay=${hoursPerDay}&monthlyBill=0&country=${encodeURIComponent(userCountry)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysis(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setCurrentStep(3); // Move to results
    } catch (err: any) {
      console.error('Solar irrigation analysis error:', err);
      setError(err.message || 'Failed to calculate. Please try again.');
      setCurrentStep(1); // Go back to pump details
    } finally {
      setLoading(false);
    }
  };

  const canProceed = (step: number) => {
    if (step === 0) return latitude && longitude;
    if (step === 1) return pumpHP > 0 && hoursPerDay > 0;
    return true;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 1) {
        handleCalculate();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ y: -20, x: Math.random() * 100 + '%', opacity: 1 }}
              animate={{ y: '100vh', rotate: 360 }}
              transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
            >
              {['🎉', '⭐', '💰', '☀️'][Math.floor(Math.random() * 4)]}
            </motion.div>
          ))}
        </div>
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Solar Irrigation Calculator
        </CardTitle>
        <CardDescription>
          Find out how much you can save with solar power!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
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
                  <h3 className="text-xl font-bold text-gray-900">📍 Where's Your Farm?</h3>
                  <p className="text-sm text-muted-foreground">We'll find the best solar solution for your location</p>
                </div>

                <Button
                  onClick={handleUseMyLocation}
                  disabled={loadingLocation}
                  variant="outline"
                  size="lg"
                  className="w-full h-16 text-lg"
                >
                  {loadingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-5 w-5" />
                       Use My Current Location
                    </>
                  )}
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
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      step="0.000001"
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 73.8502"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      step="0.000001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Pump Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">⚡ Tell Us About Your Pump</h3>
                  <p className="text-sm text-muted-foreground">Move the sliders to match your setup</p>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Pump Power</Label>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {pumpHP} HP = {(pumpHP * 0.746).toFixed(1)} kW
                      </Badge>
                    </div>
                    <Slider
                      value={[pumpHP]}
                      onValueChange={([value]) => setPumpHP(value)}
                      min={3}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3 HP (Small)</span>
                      <span>20 HP (Large)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Daily Usage</Label>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {hoursPerDay} hours/day
                      </Badge>
                    </div>
                    <Slider
                      value={[hoursPerDay]}
                      onValueChange={([value]) => setHoursPerDay(value)}
                      min={1}
                      max={12}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 hour</span>
                      <span>12 hours</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-amber-700 font-medium">
                      ☀️ {hoursPerDay} hours = {(pumpHP * 0.746 * hoursPerDay).toFixed(1)} kWh/day
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: AI Magic Loading */}
            {currentStep === 2 && (
              <div className="flex flex-col items-center justify-center space-y-6 py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-16 w-16 text-yellow-500" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900">🤖 AI is Working Magic!</h3>
                <div className="space-y-2 text-center">
                  <p className="text-muted-foreground">✨ Analyzing solar potential...</p>
                  <p className="text-muted-foreground">🔍 Searching government subsidies...</p>
                  <p className="text-muted-foreground">💰 Calculating your savings...</p>
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

            {/* Step 3: Results */}
            {currentStep === 3 && analysis && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <motion.h3
                    className="text-2xl font-bold text-green-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    🎉 Amazing Savings Ahead!
                  </motion.h3>
                  <p className="text-sm text-muted-foreground">Here's what solar can do for you</p>
                </div>

                {/* Monthly Savings - Hero */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center"
                >
                  <p className="text-sm opacity-90">💰 You Save Every Month</p>
                  <motion.p
                    className="text-5xl font-bold my-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    ₹{Math.round(analysis.annualSavings / 12).toLocaleString()}
                  </motion.p>
                  <p className="text-sm opacity-90">
                    = {Math.round(analysis.annualSavings / 12 / 30)} days of FREE power!
                  </p>
                </motion.div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">⏰ Payback</p>
                    <p className="text-2xl font-bold text-yellow-700">{analysis.paybackPeriod.toFixed(1)} yrs</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">💰 20-Year Profit</p>
                    <p className="text-2xl font-bold text-blue-700">₹{(analysis.twentyYearSavings / 100000).toFixed(1)}L</p>
                  </div>
                </div>

                {/* Subsidy Info */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">🎁 Government Subsidy</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">{analysis.subsidyScheme}</span>
                    <span className="font-bold text-green-600">-₹{analysis.subsidyAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="font-semibold">You Pay</span>
                    <span className="text-xl font-bold">₹{analysis.netCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full h-12 text-lg" size="lg">
                  🌟 Start Your Solar Journey
                </Button>
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
        {currentStep < 3 && (
          <div className="flex gap-3 pt-4 border-t">
            {currentStep > 0 && currentStep < 2 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep < 2 && (
              <Button
                onClick={nextStep}
                className="flex-1"
                disabled={!canProceed(currentStep) || loading}
              >
                {currentStep === 1 ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Calculate Savings
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Restart Button on Results */}
        {currentStep === 3 && (
          <Button
            onClick={() => {
              setCurrentStep(0);
              setAnalysis(null);
            }}
            variant="outline"
            className="w-full"
          >
            🔄 Calculate for Another Farm
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
