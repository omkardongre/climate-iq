"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Loader2, Leaf, TrendingDown, TrendingUp, AlertCircle, Lightbulb, DollarSign, Clock, Sprout, Users, Zap, Fuel, Tractor, ChevronRight, Sparkles, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';


interface CarbonData {
  emissions: {
    monthly: number;
    annual: number;
    perAcre: number;
  };
  breakdown: {
    fuel: number;
    electricity: number;
    fertilizer: number;
    livestock: number;
    irrigation: number;
  };
  comparison: {
    benchmark: number;
    difference: number;
    rating: string;
    ratingColor: string;
  };
  quickWins: Array<{
    category: string;
    currentEmissions: number;
    potentialReduction: number;
    percentage: number;
  }>;
}

interface Recommendation {
  title: string;
  description: string;
  impact: number;
  cost: string;
  timeframe: string;
}

export function CarbonTracker() {
  // Form data
  const [farmSize, setFarmSize] = useState(10);
  const [cropType, setCropType] = useState('');
  
  // Fuel
  const [diesel, setDiesel] = useState(0);
  const [petrol, setPetrol] = useState(0);
  
  // Electricity
  const [electricity, setElectricity] = useState(0);
  
  // Fertilizers
  const [urea, setUrea] = useState(0);
  const [dap, setDap] = useState(0);
  const [organic, setOrganic] = useState(0);
  
  // Livestock
  const [cattle, setCattle] = useState(0);
  const [buffalo, setBuffalo] = useState(0);
  const [goat, setGoat] = useState(0);
  
  // Irrigation
  const [electricPump, setElectricPump] = useState(0);
  const [dieselPump, setDieselPump] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState('');
  const [recError, setRecError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Live preview calculation
  const [liveEmissions, setLiveEmissions] = useState(0);
  const [completedSections, setCompletedSections] = useState(0);

  // Calculate live emissions preview
  useEffect(() => {
    const fuelEmissions = (diesel * 2.68) + (petrol * 2.31);
    const electricityEmissions = electricity * 0.82; // India default
    const fertilizerEmissions = (urea * 5.5) + (dap * 1.2) + (organic * 0.3);
    const livestockEmissions = (cattle * 100) + (buffalo * 120) + (goat * 8);
    const irrigationEmissions = (electricPump * 3 * 0.82) + (dieselPump * 2.5 * 2.68);
    
    const total = fuelEmissions + electricityEmissions + fertilizerEmissions + livestockEmissions + irrigationEmissions;
    setLiveEmissions(total);
    
    // Count completed sections
    let completed = 0;
    if (farmSize && cropType) completed++;
    if (diesel || petrol || electricity || electricPump || dieselPump) completed++;
    if (urea || dap || organic) completed++;
    if (cattle || buffalo || goat) completed++;
    setCompletedSections(completed);
  }, [farmSize, cropType, diesel, petrol, electricity, urea, dap, organic, cattle, buffalo, goat, electricPump, dieselPump]);

  // Get color based on emissions
  const getEmissionColor = () => {
    if (liveEmissions < 500) return 'from-green-500 to-emerald-600';
    if (liveEmissions < 1500) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getEmissionRating = () => {
    if (liveEmissions < 500) return '🌟 Eco Champion';
    if (liveEmissions < 1500) return '⚖️ Average';
    return '⚠️ High Impact';
  };

  const handleCalculate = async () => {
    if (!farmSize || !cropType) {
      setError('Please complete Farm Basics section');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Get user's country from localStorage
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

      const response = await fetch('/api/agriculture/carbon-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmSize,
          cropType,
          country: userCountry,
          diesel,
          petrol,
          electricity,
          urea,
          dap,
          organic,
          cattle,
          buffalo,
          goat,
          electricPump,
          dieselPump,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate carbon footprint');
      }

      const data = await response.json();
      setCarbonData(data);
      
      // Celebration!
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      
      // Save to history
      const history = JSON.parse(localStorage.getItem('carbonHistory') || '[]');
      history.push({
        date: new Date().toISOString(),
        ...data.emissions,
      });
      localStorage.setItem('carbonHistory', JSON.stringify(history.slice(-12)));
      
      // Get AI recommendations
      await fetchRecommendations(data);
      
    } catch (err: any) {
      setError(err.message || 'Failed to calculate carbon footprint');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (carbonData: CarbonData) => {
    setLoadingRecs(true);
    setRecError('');
    
    try {
      // Get user country
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

      const response = await fetch('/api/agriculture/carbon-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          carbonData,
          country: userCountry,
          cropType,
          diesel,
          cattle
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err: any) {
      setRecError(err.message);
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confetti Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-9xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Live Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              Carbon Footprint Calculator
            </CardTitle>
            <CardDescription>
              Interactive farm carbon tracker with real-time preview
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Live Carbon Meter */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 border-primary">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Live Estimate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <motion.div
                  key={liveEmissions}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-3xl font-bold bg-gradient-to-r ${getEmissionColor()} bg-clip-text text-transparent`}
                >
                  {liveEmissions.toFixed(0)}
                </motion.div>
                <div className="text-xs text-muted-foreground">kg CO2e/month</div>
                <Badge variant="secondary" className="text-xs">
                  {getEmissionRating()}
                </Badge>
              </div>
              <Progress value={(completedSections / 4) * 100} className="mt-3 h-1" />
              <div className="text-xs text-center mt-1 text-muted-foreground">
                {completedSections}/4 sections completed
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Interactive Accordion Form */}
      <Card>
        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={["farm"]} className="space-y-4">
            {/* 1. Farm Basics */}
            <AccordionItem value="farm" className="border rounded-lg px-4 data-[state=open]:bg-green-50/50">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Tractor className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">🏡 Farm Basics</div>
                    <div className="text-xs text-muted-foreground">
                      {farmSize && cropType ? `${farmSize} acres • ${cropType}` : 'Start here'}
                    </div>
                  </div>
                  {farmSize && cropType && (
                    <Badge variant="secondary" className="ml-auto mr-2">✓</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Farm Size: <span className="font-bold text-primary">{farmSize} acres</span>
                  </Label>
                  <Slider
                    value={[farmSize]}
                    onValueChange={(val) => setFarmSize(val[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 acre</span>
                    <span>100 acres</span>
                  </div>
                </div>
                <div>
                  <Label>Crop Type *</Label>
                  <Select value={cropType} onValueChange={setCropType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rice">🌾 Rice</SelectItem>
                      <SelectItem value="wheat">🌾 Wheat</SelectItem>
                      <SelectItem value="sugarcane">🎋 Sugarcane</SelectItem>
                      <SelectItem value="cotton">☁️ Cotton</SelectItem>
                      <SelectItem value="vegetables">🥬 Vegetables</SelectItem>
                      <SelectItem value="pulses">🫘 Pulses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Energy & Fuel */}
            <AccordionItem value="energy" className="border rounded-lg px-4 data-[state=open]:bg-blue-50/50">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Fuel className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">⛽ Energy & Fuel</div>
                    <div className="text-xs text-muted-foreground">
                      {(diesel || petrol || electricity) ? 
                        `${((diesel * 2.68) + (petrol * 2.31) + (electricity * 0.82)).toFixed(0)} kg CO2e` : 
                        'Diesel, electricity, pumps'}
                    </div>
                  </div>
                  {(diesel || petrol || electricity) && (
                    <Badge variant="secondary" className="ml-auto mr-2">✓</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Diesel (L/month)</Label>
                    <Input
                      type="number"
                      value={diesel}
                      onChange={(e) => setDiesel(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Petrol (L/month)</Label>
                    <Input
                      type="number"
                      value={petrol}
                      onChange={(e) => setPetrol(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Electricity (kWh/month)</Label>
                    <Input
                      type="number"
                      value={electricity}
                      onChange={(e) => setElectricity(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Electric Pump (hrs/month)</Label>
                    <Input
                      type="number"
                      value={electricPump}
                      onChange={(e) => setElectricPump(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Diesel Pump (hrs/month)</Label>
                    <Input
                      type="number"
                      value={dieselPump}
                      onChange={(e) => setDieselPump(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Farm Inputs */}
            <AccordionItem value="inputs" className="border rounded-lg px-4 data-[state=open]:bg-orange-50/50">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Sprout className="h-5 w-5 text-orange-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">🌱 Farm Inputs</div>
                    <div className="text-xs text-muted-foreground">
                      {(urea || dap || organic) ? 
                        `${((urea * 5.5) + (dap * 1.2) + (organic * 0.3)).toFixed(0)} kg CO2e` : 
                        'Fertilizers'}
                    </div>
                  </div>
                  {(urea || dap || organic) && (
                    <Badge variant="secondary" className="ml-auto mr-2">✓</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Urea (kg/season)</Label>
                    <Input
                      type="number"
                      value={urea}
                      onChange={(e) => setUrea(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>DAP (kg/season)</Label>
                    <Input
                      type="number"
                      value={dap}
                      onChange={(e) => setDap(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Organic (kg/season)</Label>
                    <Input
                      type="number"
                      value={organic}
                      onChange={(e) => setOrganic(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Livestock */}
            <AccordionItem value="livestock" className="border rounded-lg px-4 data-[state=open]:bg-amber-50/50">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Users className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">🐄 Livestock</div>
                    <div className="text-xs text-muted-foreground">
                      {(cattle || buffalo || goat) ? 
                        `${((cattle * 100) + (buffalo * 120) + (goat * 8)).toFixed(0)} kg CO2e` : 
                        'Cattle, buffalo, goats'}
                    </div>
                  </div>
                  {(cattle || buffalo || goat) && (
                    <Badge variant="secondary" className="ml-auto mr-2">✓</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Cattle</Label>
                    <Input
                      type="number"
                      value={cattle}
                      onChange={(e) => setCattle(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Buffalo</Label>
                    <Input
                      type="number"
                      value={buffalo}
                      onChange={(e) => setBuffalo(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Goat/Sheep</Label>
                    <Input
                      type="number"
                      value={goat}
                      onChange={(e) => setGoat(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Calculate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              onClick={handleCalculate}
              disabled={loading || !farmSize || !cropType}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Calculate Carbon Footprint
                </>
              )}
            </Button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Results Section (Keep existing results UI) */}
      {carbonData && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Achievement Badge */}
          <Card className="border-2 border-primary bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="pt-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
              >
                <Award className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Analysis Complete!</h3>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {carbonData.comparison.rating}
              </Badge>
            </CardContent>
          </Card>

          {/* Emissions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Monthly Emissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {carbonData.emissions.monthly.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">kg CO2e</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Annual Emissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {carbonData.emissions.annual.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">kg CO2e</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Per Acre</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {carbonData.emissions.perAcre.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">kg CO2e/acre</div>
              </CardContent>
            </Card>
          </div>

          {/* Emissions Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Emissions Breakdown</CardTitle>
              <CardDescription>Where your emissions come from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(carbonData.breakdown).map(([category, value]) => {
                const percentage = (value / carbonData.emissions.monthly) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="capitalize font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        {value.toFixed(0)} kg CO2e ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  {loadingRecs ? 'Loading personalized suggestions...' : 'Ways to reduce your carbon footprint'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingRecs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge variant="secondary">
                          -{rec.impact} kg CO2e
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {rec.cost}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rec.timeframe}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {recError && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800 text-sm">
              <AlertCircle className="h-4 w-4" />
              Couldn't load recommendations, but your carbon calculation is still accurate.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
