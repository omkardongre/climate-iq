"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Droplets, Zap, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UsageStats {
  totalWater?: number;
  totalElectricity?: number;
  totalCarbon: number;
  totalCost?: number;
  avgDaily: number;
  nationalAvg: number;
  comparison: number;
  daysTracked: number;
}

export function SmartHomeTracker() {
  const [activeTab, setActiveTab] = useState('water');
  const { user } = useAuth();
  
  // Water state
  const [waterLiters, setWaterLiters] = useState('');
  const [waterStats, setWaterStats] = useState<UsageStats | null>(null);
  const [waterLoading, setWaterLoading] = useState(false);
  
  // Electricity state
  const [electricityKwh, setElectricityKwh] = useState('');
  const [electricityStats, setElectricityStats] = useState<UsageStats | null>(null);
  const [electricityLoading, setElectricityLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch stats when user changes
  useEffect(() => {
    if (user) {
      console.log('SmartHomeTracker - Logged in user:', user.id);
      fetchWaterStats(user.id);
      fetchElectricityStats(user.id);
    } else {
      console.log('SmartHomeTracker - No user logged in');
    }
  }, [user]);

  const fetchWaterStats = async (uid: string) => {
    try {
      const response = await fetch(`/api/urban/water-usage?userId=${uid}&days=30`);
      const data = await response.json();
      if (response.ok) {
        setWaterStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch water stats:', err);
    }
  };

  const fetchElectricityStats = async (uid: string) => {
    try {
      const response = await fetch(`/api/urban/electricity-usage?userId=${uid}&days=30`);
      const data = await response.json();
      if (response.ok) {
        setElectricityStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch electricity stats:', err);
    }
  };

  const handleWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const liters = parseFloat(waterLiters);
    if (isNaN(liters) || liters <= 0) {
      setError('Please enter a valid water usage amount');
      return;
    }

    setWaterLoading(true);

    try {
      console.log('Saving water usage with userId:', user?.id);
      const response = await fetch('/api/urban/water-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          waterLiters: liters,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();
      console.log('Water usage response:', data);

      if (!response.ok) {
        setError(data.error || 'Failed to save water usage');
      } else {
        setSuccess(`Water usage saved! Carbon footprint: ${data.carbonFootprint.toFixed(2)} kg CO2e`);
        setWaterLiters('');
        if (user) fetchWaterStats(user.id);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setWaterLoading(false);
    }
  };

  const handleElectricitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const kwh = parseFloat(electricityKwh);
    if (isNaN(kwh) || kwh < 0) {
      setError('Please enter a valid electricity usage amount');
      return;
    }

    setElectricityLoading(true);

    try {
      const response = await fetch('/api/urban/electricity-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          electricityKwh: kwh,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save electricity usage');
      } else {
        setSuccess(`Electricity usage saved! Carbon: ${data.carbonFootprint.toFixed(2)} kg CO2e, Cost: ₹${data.cost.toFixed(2)}`);
        setElectricityKwh('');
        if (user) fetchElectricityStats(user.id);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setElectricityLoading(false);
    }
  };

  const getComparisonIcon = (comparison: number) => {
    if (comparison > 10) return <TrendingUp className="h-5 w-5 text-red-600" />;
    if (comparison < -10) return <TrendingDown className="h-5 w-5 text-green-600" />;
    return <Minus className="h-5 w-5 text-yellow-600" />;
  };

  const getComparisonText = (comparison: number) => {
    if (comparison > 10) return `${comparison.toFixed(0)}% above average`;
    if (comparison < -10) return `${Math.abs(comparison).toFixed(0)}% below average`;
    return 'Near average';
  };

  const getComparisonColor = (comparison: number) => {
    if (comparison > 10) return 'text-red-600 bg-red-50 border-red-200';
    if (comparison < -10) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Smart Home Tracker
          </CardTitle>
          <CardDescription>
            Track your water and electricity usage, calculate carbon footprint
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Success</AlertTitle>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="water">
            <Droplets className="h-4 w-4 mr-2" />
            Water Usage
          </TabsTrigger>
          <TabsTrigger value="electricity">
            <Zap className="h-4 w-4 mr-2" />
            Electricity Usage
          </TabsTrigger>
        </TabsList>

        {/* Water Tab */}
        <TabsContent value="water" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Water Usage</CardTitle>
                <CardDescription>Enter today's water consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWaterSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="water-liters">Water Usage (Liters)</Label>
                    <Input
                      id="water-liters"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 245"
                      value={waterLiters}
                      onChange={(e) => setWaterLiters(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Average: 135 L/person/day in India
                    </p>
                  </div>
                  <Button type="submit" disabled={waterLoading} className="w-full">
                    {waterLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Water Usage'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Stats Card */}
            {waterStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">30-Day Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Water Used</p>
                    <p className="text-2xl font-bold">{waterStats.totalWater?.toFixed(0)} L</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                    <p className="text-2xl font-bold text-green-600">
                      {waterStats.totalCarbon.toFixed(2)} kg CO2e
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                    <p className="text-xl font-semibold">{waterStats.avgDaily.toFixed(1)} L/day</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${getComparisonColor(waterStats.comparison)}`}>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(waterStats.comparison)}
                      <div>
                        <p className="text-sm font-medium">{getComparisonText(waterStats.comparison)}</p>
                        <p className="text-xs">National avg: {waterStats.nationalAvg} L/day</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tracked {waterStats.daysTracked} days in last 30 days
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Electricity Tab */}
        <TabsContent value="electricity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Electricity Usage</CardTitle>
                <CardDescription>Enter today's electricity consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleElectricitySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="electricity-kwh">Electricity Usage (kWh)</Label>
                    <Input
                      id="electricity-kwh"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 12.5"
                      value={electricityKwh}
                      onChange={(e) => setElectricityKwh(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Average: 3 kWh/day in India
                    </p>
                  </div>
                  <Button type="submit" disabled={electricityLoading} className="w-full">
                    {electricityLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Electricity Usage'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Stats Card */}
            {electricityStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">30-Day Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Electricity Used</p>
                    <p className="text-2xl font-bold">{electricityStats.totalElectricity?.toFixed(1)} kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {electricityStats.totalCarbon.toFixed(2)} kg CO2e
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-semibold text-red-600">
                      ₹{electricityStats.totalCost?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                    <p className="text-xl font-semibold">{electricityStats.avgDaily.toFixed(1)} kWh/day</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${getComparisonColor(electricityStats.comparison)}`}>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(electricityStats.comparison)}
                      <div>
                        <p className="text-sm font-medium">{getComparisonText(electricityStats.comparison)}</p>
                        <p className="text-xs">National avg: {electricityStats.nationalAvg} kWh/day</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tracked {electricityStats.daysTracked} days in last 30 days
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Combined Impact Card */}
      {(waterStats || electricityStats) && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Combined Environmental Impact (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Carbon</p>
                <p className="text-2xl font-bold text-green-600">
                  {((waterStats?.totalCarbon || 0) + (electricityStats?.totalCarbon || 0)).toFixed(2)} kg
                </p>
                <p className="text-xs text-muted-foreground">CO2e emissions</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Equivalent To</p>
                <p className="text-lg font-semibold">
                  {(((waterStats?.totalCarbon || 0) + (electricityStats?.totalCarbon || 0)) * 4).toFixed(0)} km
                </p>
                <p className="text-xs text-muted-foreground">🚗 driving</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trees Needed</p>
                <p className="text-lg font-semibold">
                  {(((waterStats?.totalCarbon || 0) + (electricityStats?.totalCarbon || 0)) / 20).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">🌳 for 1 year</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-lg font-semibold text-red-600">
                  ₹{(electricityStats?.totalCost || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Electricity only</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
