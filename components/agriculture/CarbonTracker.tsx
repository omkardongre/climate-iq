"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Leaf, TrendingDown, TrendingUp, AlertCircle, Lightbulb, DollarSign, Clock, Sprout, Users } from 'lucide-react';
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
  const [farmSize, setFarmSize] = useState('');
  const [cropType, setCropType] = useState('');
  
  // Fuel
  const [diesel, setDiesel] = useState('');
  const [petrol, setPetrol] = useState('');
  
  // Electricity
  const [electricity, setElectricity] = useState('');
  
  // Fertilizers
  const [urea, setUrea] = useState('');
  const [dap, setDap] = useState('');
  const [organic, setOrganic] = useState('');
  
  // Livestock
  const [cattle, setCattle] = useState('');
  const [buffalo, setBuffalo] = useState('');
  const [goat, setGoat] = useState('');
  
  // Irrigation
  const [electricPump, setElectricPump] = useState('');
  const [dieselPump, setDieselPump] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState('');
  const [recError, setRecError] = useState('');

  const handleCalculate = async () => {
    if (!farmSize || !cropType) {
      setError('Please enter farm size and crop type');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Get user's country from localStorage (set by location selector)
      let userCountry = 'India'; // Default
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
          farmSize: parseFloat(farmSize),
          cropType,
          country: userCountry,
          diesel: parseFloat(diesel) || 0,
          petrol: parseFloat(petrol) || 0,
          electricity: parseFloat(electricity) || 0,
          urea: parseFloat(urea) || 0,
          dap: parseFloat(dap) || 0,
          organic: parseFloat(organic) || 0,
          cattle: parseInt(cattle) || 0,
          buffalo: parseInt(buffalo) || 0,
          goat: parseInt(goat) || 0,
          electricPump: parseFloat(electricPump) || 0,
          dieselPump: parseFloat(dieselPump) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate carbon footprint');
      }

      const data = await response.json();
      setCarbonData(data);
      
      // Save to local storage
      const history = JSON.parse(localStorage.getItem('carbonHistory') || '[]');
      history.push({
        date: new Date().toISOString(),
        ...data.emissions,
      });
      localStorage.setItem('carbonHistory', JSON.stringify(history.slice(-12))); // Keep last 12 months
      
      // Get recommendations
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
      const response = await fetch('/api/agriculture/carbon-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmSize: parseFloat(farmSize),
          cropType,
          emissions: carbonData.emissions,
          breakdown: carbonData.breakdown,
          quickWins: carbonData.quickWins,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Show error to user instead of hiding it
        setRecError(data.message || 'Failed to generate AI recommendations');
        setRecommendations([]);
      } else {
        setRecommendations(data.recommendations || []);
      }
    } catch (err: any) {
      setRecError(err.message || 'Network error: Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'Immediate': return '⚡';
      case 'Short-term': return '📅';
      case 'Long-term': return '🎯';
      default: return '📌';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-600" />
            Carbon Footprint Calculator
          </CardTitle>
          <CardDescription>
            Calculate your farm's carbon emissions using IPCC emission factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-700">
                <Leaf className="h-4 w-4" />
                1. Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Farm Size (acres) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Crop Type *</Label>
                  <Select value={cropType} onValueChange={setCropType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rice">Rice</SelectItem>
                      <SelectItem value="wheat">Wheat</SelectItem>
                      <SelectItem value="sugarcane">Sugarcane</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="pulses">Pulses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
                <Lightbulb className="h-4 w-4" />
                2. Fuel & Energy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Diesel (liters/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={diesel}
                    onChange={(e) => setDiesel(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Petrol (liters/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 20"
                    value={petrol}
                    onChange={(e) => setPetrol(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Electricity (kWh/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={electricity}
                    onChange={(e) => setElectricity(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Electric Pump (hours/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 80"
                    value={electricPump}
                    onChange={(e) => setElectricPump(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Diesel Pump (hours/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 40"
                    value={dieselPump}
                    onChange={(e) => setDieselPump(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-700">
                <Sprout className="h-4 w-4" />
                3. Farm Inputs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Urea (kg/season)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 200"
                    value={urea}
                    onChange={(e) => setUrea(e.target.value)}
                  />
                </div>
                <div>
                  <Label>DAP (kg/season)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 150"
                    value={dap}
                    onChange={(e) => setDap(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Organic Fertilizer (kg/season)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={organic}
                    onChange={(e) => setOrganic(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-700">
                <Users className="h-4 w-4" />
                4. Livestock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Cattle (number)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={cattle}
                    onChange={(e) => setCattle(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Buffalo (number)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={buffalo}
                    onChange={(e) => setBuffalo(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Goat/Sheep (number)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={goat}
                    onChange={(e) => setGoat(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full mt-8"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Leaf className="mr-2 h-4 w-4" />
                Calculate Carbon Footprint
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {carbonData && (
        <>
          {/* Emissions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Monthly Emissions</CardDescription>
                <CardTitle className="text-3xl text-orange-600">
                  {carbonData.emissions.monthly.toFixed(0)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">kg CO2e/month</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Annual Emissions</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  {carbonData.emissions.annual.toFixed(0)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">kg CO2e/year</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Per Acre</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {carbonData.emissions.perAcre.toFixed(0)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">kg CO2e/acre/year</p>
              </CardHeader>
            </Card>
          </div>

          {/* Rating & Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                Efficiency Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Farm</span>
                <Badge
                  style={{ backgroundColor: carbonData.comparison.ratingColor }}
                  className="text-white text-lg px-4 py-1"
                >
                  {carbonData.comparison.rating}
                </Badge>
              </div>
              


              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">vs. {cropType} Average</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      {carbonData.comparison.difference > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          +{carbonData.comparison.difference.toFixed(0)}%
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-500" />
                          {carbonData.comparison.difference.toFixed(0)}%
                        </>
                      )}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.abs(carbonData.comparison.difference))}
                    className="h-3"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Benchmark: {carbonData.comparison.benchmark} kg CO2e/acre/year for {cropType}
              </p>
            </CardContent>
          </Card>

          {/* Emissions Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Emissions Breakdown</CardTitle>
              <CardDescription>Where your emissions come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(carbonData.breakdown).map(([category, percentage]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <span className="text-sm font-bold">{(percentage || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage || 0} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Wins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Top Reduction Opportunities
              </CardTitle>
              <CardDescription>Focus on these areas for maximum impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {carbonData.quickWins.map((win, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-green-900">{win.category}</span>
                      <Badge className="bg-green-600">{win.percentage}%</Badge>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {win.potentialReduction.toFixed(0)} kg
                    </p>
                    <p className="text-xs text-green-600">potential reduction/month</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {loadingRecs ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
                <p className="text-sm text-muted-foreground">Generating AI recommendations...</p>
              </CardContent>
            </Card>
          ) : recError ? (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  AI Recommendations Unavailable
                </CardTitle>
                <CardDescription className="text-red-600">
                  Gemini AI service error
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-2">Error Details:</p>
                  <p className="text-sm text-red-600">{recError}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Your carbon calculations are still accurate. Only AI recommendations are affected.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-emerald-600" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>Powered by Gemini AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{rec.impact.toFixed(0)} kg CO2e/year</span>
                        </div>
                        <Badge className={getCostColor(rec.cost)}>{rec.cost} Cost</Badge>
                        <div className="flex items-center gap-1">
                          <span>{getTimeframeIcon(rec.timeframe)}</span>
                          <span className="text-muted-foreground">{rec.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
