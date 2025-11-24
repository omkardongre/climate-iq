"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sun, Loader2, TrendingUp, Leaf, DollarSign, Zap, MapPin, ChevronRight, ChevronLeft, Sparkles, Building2, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';

interface SolarAnalysis {
  solarRadiation: number;
  annualProduction: number;
  capacityFactor: number;
  systemSize: number;
  annualSavings: number;
  paybackPeriod: number;
  twentyYearSavings: number;
  carbonOffset: number;
  treesEquivalent: number;
  location: string;
}

interface Installer {
  name: string;
  rating: string;
  services: string;
  contact: string;
}

interface Subsidy {
  scheme_name: string;
  provider: string;
  benefit: string;
  eligibility: string;
}

export function SolarSavingsCalculator() {
  const [step, setStep] = useState(1);
  const [monthlyBill, setMonthlyBill] = useState(3000);
  const [roofSize, setRoofSize] = useState(1000);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [analysis, setAnalysis] = useState<SolarAnalysis | null>(null);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to get your location. Please enable location access or enter manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!latitude || !longitude)) {
      setError('Please set your location first');
      return;
    }
    if (step === 2 && monthlyBill <= 0) {
      setError('Please enter a valid monthly bill');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Fetch solar analysis
      const solarResponse = await fetch(
        `/api/urban/solar-analysis?lat=${lat}&lon=${lng}&monthlyBill=${monthlyBill}&roofSize=${roofSize}`
      );

      if (!solarResponse.ok) {
        throw new Error('Failed to fetch solar analysis');
      }

      const solarData = await solarResponse.json();
      setAnalysis(solarData);

      // Fetch installers and subsidies
      const savedLocation = localStorage.getItem('climateIQ-location');
      let city = 'your city';
      let country = 'India';
      
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          city = locationData.name || locationData.city || city;
          country = locationData.country || country;
        } catch (e) {
          // Use defaults
        }
      }

      const installersResponse = await fetch('/api/urban/solar-installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country }),
      });

      const installersData = await installersResponse.json();
      setInstallers(installersData.installers || []);
      setSubsidies(installersData.subsidies || []);

      setStep(4);
      
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err: any) {
      console.error('Solar analysis error:', err);
      setError(err.message || 'Failed to calculate solar savings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              Solar Savings Calculator
            </CardTitle>
            <Badge variant="outline">Step {step}/4</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Step 1: Your Location
                </CardTitle>
                <CardDescription>We need your location to calculate solar potential</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      placeholder="e.g., 19.076"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      step="0.000001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      placeholder="e.g., 72.877"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      step="0.000001"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleUseMyLocation}
                  disabled={loadingLocation}
                  variant="outline"
                  className="w-full"
                >
                  {loadingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Use My Current Location
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Step 2: Home Details
                </CardTitle>
                <CardDescription>Tell us about your electricity usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="monthlyBill">Monthly Electricity Bill: ₹{monthlyBill.toLocaleString()}</Label>
                  <Slider
                    id="monthlyBill"
                    min={500}
                    max={20000}
                    step={500}
                    value={[monthlyBill]}
                    onValueChange={(value) => setMonthlyBill(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">Adjust the slider to match your average monthly bill</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="roofSize">Available Roof Space: {roofSize} sq ft</Label>
                  <Slider
                    id="roofSize"
                    min={200}
                    max={3000}
                    step={100}
                    value={[roofSize]}
                    onValueChange={(value) => setRoofSize(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">Estimated usable roof area for solar panels</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="border-2 border-yellow-200">
              <CardContent className="py-12 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sun className="h-24 w-24 text-yellow-500 mb-6" />
                </motion.div>
                {loading ? (
                  <>
                    <h3 className="text-2xl font-bold mb-2">Analyzing Solar Potential...</h3>
                    <p className="text-muted-foreground mb-4">Using NREL satellite data</p>
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground mb-6">Click below to calculate your solar savings</p>
                    <Button onClick={handleAnalyze} size="lg" className="gap-2">
                      <Sparkles className="h-5 w-5" />
                      Calculate Savings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 4 && analysis && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Main Results */}
            <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Your Solar Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-4 bg-white rounded-lg"
                  >
                    <p className="text-sm text-muted-foreground mb-1">Annual Savings</p>
                    <p className="text-3xl font-bold text-green-600">₹{analysis.annualSavings.toLocaleString()}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-4 bg-white rounded-lg"
                  >
                    <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                    <p className="text-3xl font-bold text-purple-600">{analysis.paybackPeriod.toFixed(1)} years</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center p-4 bg-white rounded-lg"
                  >
                    <p className="text-sm text-muted-foreground mb-1">20-Year Savings</p>
                    <p className="text-3xl font-bold text-blue-600">₹{(analysis.twentyYearSavings / 100000).toFixed(1)}L</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">❌ Without Solar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">₹{(monthlyBill * 12).toLocaleString()}/year</p>
                  <p className="text-sm text-muted-foreground mt-2">Grid electricity costs keep rising</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-300">
                <CardHeader>
                  <CardTitle className="text-lg">✅ With Solar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">₹{((monthlyBill * 12) - analysis.annualSavings).toLocaleString()}/year</p>
                  <p className="text-sm text-muted-foreground mt-2">Reduced electricity costs + clean energy</p>
                </CardContent>
              </Card>
            </div>

            {/* Environmental Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Carbon Offset</p>
                    <p className="text-2xl font-bold text-green-600">{analysis.carbonOffset.toFixed(1)} tons CO₂/year</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Equivalent Trees Planted</p>
                    <p className="text-2xl font-bold text-green-600">{analysis.treesEquivalent} trees/year</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subsidies */}
            {subsidies.length > 0 && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Government Subsidies Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subsidies.map((subsidy, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 bg-blue-50 rounded-lg"
                      >
                        <h4 className="font-semibold text-blue-900">{subsidy.scheme_name}</h4>
                        <p className="text-sm text-muted-foreground">{subsidy.provider}</p>
                        <p className="text-sm font-medium text-blue-700 mt-2">💰 {subsidy.benefit}</p>
                        <p className="text-xs text-muted-foreground mt-1">{subsidy.eligibility}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Installers */}
            {installers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Recommended Solar Installers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {installers.map((installer, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <h4 className="font-semibold">{installer.name}</h4>
                        <p className="text-sm text-yellow-600">⭐ {installer.rating}</p>
                        <p className="text-sm text-muted-foreground mt-2">{installer.services}</p>
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {installer.contact}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">System Size</p>
                    <p className="font-bold">{analysis.systemSize.toFixed(1)} kW</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Solar Radiation</p>
                    <p className="font-bold">{analysis.solarRadiation.toFixed(2)} kWh/m²/day</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Production</p>
                    <p className="font-bold">{analysis.annualProduction.toLocaleString()} kWh</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * Data from NREL PVWatts. System cost: ₹50,000/kW. Electricity rate: ₹8/kWh.
                </p>
              </CardContent>
            </Card>

            <Button onClick={() => { setStep(1); setAnalysis(null); }} variant="outline" className="w-full">
              Calculate Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-red-300 bg-red-50">
            <CardContent className="py-4">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex gap-2">
          {step > 1 && (
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step < 3 && (
            <Button onClick={handleNext} className="flex-1 gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
