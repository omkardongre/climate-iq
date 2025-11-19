"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Loader2, TrendingUp, Leaf, DollarSign, Droplets, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  netCost: number;
  twentyYearSavings: number;
  carbonOffset: number;
  location: string;
}

export function SolarIrrigationCalculator() {
  const [pumpHP, setPumpHP] = useState<string>('');
  const [hoursPerDay, setHoursPerDay] = useState<string>('');
  const [monthlyBill, setMonthlyBill] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [analysis, setAnalysis] = useState<SolarIrrigationAnalysis | null>(null);
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
      setError('Failed to get your location. Please enter manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCalculate = async () => {
    if (!pumpHP || !hoursPerDay || parseFloat(pumpHP) <= 0 || parseFloat(hoursPerDay) <= 0) {
      setError('Please enter valid pump HP and daily running hours');
      return;
    }

    if (!latitude || !longitude) {
      setError('Please set your location first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Invalid latitude or longitude values');
      }

      // Fetch solar analysis
      const response = await fetch(
        `/api/agriculture/solar-irrigation?lat=${lat}&lon=${lng}&pumpHP=${pumpHP}&hoursPerDay=${hoursPerDay}&monthlyBill=${monthlyBill || '0'}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch solar analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error('Solar irrigation analysis error:', err);
      setError(err.message || 'Failed to calculate solar irrigation savings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Solar Irrigation Calculator
        </CardTitle>
        <CardDescription>
          Calculate savings with solar-powered irrigation pumps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="space-y-3">
          {/* Location Section */}
          <div className="p-3 bg-muted rounded-lg space-y-3">
            <Label className="text-sm font-semibold">Farm Location</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  placeholder="e.g., 30.733"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  step="0.000001"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  placeholder="e.g., 76.779"
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
              size="sm"
              className="w-full"
            >
              {loadingLocation ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-3 w-3" />
                  Use My Location
                </>
              )}
            </Button>
          </div>

          <div>
            <Label htmlFor="pumpHP">Pump Motor Power (HP)</Label>
            <Select value={pumpHP} onValueChange={setPumpHP}>
              <SelectTrigger>
                <SelectValue placeholder="Select pump HP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 HP</SelectItem>
                <SelectItem value="5">5 HP</SelectItem>
                <SelectItem value="7.5">7.5 HP</SelectItem>
                <SelectItem value="10">10 HP</SelectItem>
                <SelectItem value="15">15 HP</SelectItem>
                <SelectItem value="20">20 HP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hoursPerDay">Daily Running Hours</Label>
            <Input
              id="hoursPerDay"
              type="number"
              placeholder="e.g., 6"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              min="1"
              max="12"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Average hours pump runs per day
            </p>
          </div>

          <div>
            <Label htmlFor="monthlyBill">Monthly Electricity Bill (₹) - Optional</Label>
            <Input
              id="monthlyBill"
              type="number"
              placeholder="e.g., 15000"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              min="0"
            />
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading || !pumpHP || !hoursPerDay || !latitude || !longitude}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Calculate Savings
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Analysis Results</h3>
              <Badge variant="outline" className="text-xs">
                {analysis.location}
              </Badge>
            </div>

            {/* System Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Solar Radiation</p>
                <p className="text-lg font-bold text-yellow-700">
                  {analysis.solarRadiation.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">kWh/m²/day</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground">System Size</p>
                <p className="text-lg font-bold text-blue-700">
                  {analysis.systemSize.toFixed(1)} kW
                </p>
                <p className="text-xs text-muted-foreground">Solar Panels</p>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span>System Cost</span>
                  <span className="font-semibold">₹{analysis.systemCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Govt. Subsidy (30%)</span>
                  <span className="font-semibold">-₹{analysis.subsidyAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1">
                  <span>Net Cost</span>
                  <span>₹{analysis.netCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Annual Savings</span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  ₹{analysis.annualSavings.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Payback Period</span>
                </div>
                <span className="text-lg font-bold text-purple-700">
                  {analysis.paybackPeriod.toFixed(1)} years
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium">20-Year Savings</span>
                </div>
                <span className="text-lg font-bold text-indigo-700">
                  ₹{(analysis.twentyYearSavings / 100000).toFixed(1)}L
                </span>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="p-4 bg-emerald-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">
                  Environmental Impact
                </span>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Carbon Offset</p>
                <p className="font-bold text-emerald-700">
                  {analysis.carbonOffset.toFixed(1)} tons CO₂/year
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Pump Power:</strong> {analysis.pumpPower.toFixed(1)} kW ({pumpHP} HP)
              </p>
              <p>
                <strong>Daily Usage:</strong> {analysis.dailyRunHours} hours
              </p>
              <p>
                <strong>Annual Production:</strong>{' '}
                {analysis.annualProduction.toLocaleString()} kWh/year
              </p>
              <p className="text-[10px] mt-2">
                * Estimates based on NREL data. Subsidy: 30% under PM-KUSUM scheme.
                Agricultural electricity rate: ₹5/kWh. System cost: ₹60,000/kW.
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        {!analysis && !error && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Calculate solar savings for your irrigation pump</p>
            <p>🌾 Includes 30% government subsidy (PM-KUSUM scheme)</p>
            <p>☀️ Powered by NREL real satellite data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
