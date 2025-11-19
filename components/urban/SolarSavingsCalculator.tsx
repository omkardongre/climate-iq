"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Loader2, TrendingUp, Leaf, DollarSign, Zap, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export function SolarSavingsCalculator() {
  const [monthlyBill, setMonthlyBill] = useState<string>('');
  const [roofSize, setRoofSize] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [analysis, setAnalysis] = useState<SolarAnalysis | null>(null);
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
    if (!monthlyBill || parseFloat(monthlyBill) <= 0) {
      setError('Please enter a valid monthly electricity bill');
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

      // Fetch solar data from NREL
      const solarResponse = await fetch(
        `/api/urban/solar-analysis?lat=${lat}&lon=${lng}&monthlyBill=${monthlyBill}&roofSize=${roofSize || '1000'}`
      );

      if (!solarResponse.ok) {
        throw new Error('Failed to fetch solar analysis');
      }

      const data = await solarResponse.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error('Solar analysis error:', err);
      setError(err.message || 'Failed to calculate solar savings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          Solar Savings Calculator
        </CardTitle>
        <CardDescription>
          Calculate potential savings with rooftop solar panels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="space-y-3">
          {/* Location Section */}
          <div className="p-3 bg-muted rounded-lg space-y-3">
            <Label className="text-sm font-semibold">Location</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="latitude" className="text-xs">Latitude</Label>
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
                <Label htmlFor="longitude" className="text-xs">Longitude</Label>
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
            <Label htmlFor="monthlyBill">Monthly Electricity Bill (₹)</Label>
            <Input
              id="monthlyBill"
              type="number"
              placeholder="e.g., 3000"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="roofSize">Roof Size (sq ft) - Optional</Label>
            <Input
              id="roofSize"
              type="number"
              placeholder="e.g., 1000 (default)"
              value={roofSize}
              onChange={(e) => setRoofSize(e.target.value)}
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for automatic calculation
            </p>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading || !monthlyBill || !latitude || !longitude}
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

            {/* Solar Potential */}
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
                <p className="text-xs text-muted-foreground">Recommended</p>
              </div>
            </div>

            {/* Financial Analysis */}
            <div className="space-y-2">
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
                  <Zap className="h-4 w-4 text-indigo-600" />
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
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Carbon Offset</p>
                  <p className="font-bold text-emerald-700">
                    {analysis.carbonOffset.toFixed(1)} tons CO₂/year
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trees Equivalent</p>
                  <p className="font-bold text-emerald-700">
                    {analysis.treesEquivalent} trees/year
                  </p>
                </div>
              </div>
            </div>

            {/* Production Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Annual Production:</strong>{' '}
                {analysis.annualProduction.toLocaleString()} kWh/year
              </p>
              <p>
                <strong>Capacity Factor:</strong> {analysis.capacityFactor.toFixed(1)}%
              </p>
              <p className="text-[10px] mt-2">
                * Estimates based on NREL PVWatts data. Actual results may vary.
                System cost assumed at ₹50,000/kW. Electricity rate: ₹8/kWh.
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        {!analysis && !error && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Enter your monthly electricity bill to see potential solar savings</p>
            <p>📍 Uses your current location for accurate solar data</p>
            <p>☀️ Powered by NREL (U.S. Dept. of Energy) real satellite data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
