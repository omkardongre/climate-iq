"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Zap, Flame, Lightbulb, Loader2, TrendingDown, Target, Award, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Appliance {
  id: string;
  name: string;
  icon: string;
  consumption: number; // kWh per month
  isOn: boolean;
  cost: number; // Calculated cost
}

interface CostRecommendation {
  title: string;
  savings: string;
  action: string;
  category: string;
}

export function SmartHomeTracker() {
  const [waterUsage, setWaterUsage] = useState<number>(0); // Start with 0
  const [waterUsageInput, setWaterUsageInput] = useState<string>(''); // For input field
  const [electricityGoal, setElectricityGoal] = useState(300);
  const [streakDays, setStreakDays] = useState(0); // Start with 0
  const [hasSetup, setHasSetup] = useState(false); // Track if user has entered data
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: '1', name: 'Air Conditioner', icon: '❄️', consumption: 0, isOn: false, cost: 0 },
    { id: '2', name: 'Refrigerator', icon: '🧊', consumption: 0, isOn: false, cost: 0 },
    { id: '3', name: 'Washing Machine', icon: '👕', consumption: 0, isOn: false, cost: 0 },
    { id: '4', name: 'Lights (LED)', icon: '💡', consumption: 0, isOn: false, cost: 0 },
    { id: '5', name: 'Water Heater', icon: '🔥', consumption: 0, isOn: false, cost: 0 },
  ]);
  
  const [recommendations, setRecommendations] = useState<CostRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const ELECTRICITY_RATE = 8; // Rs per kWh
  const WATER_RATE = 0.02; // Rs per liter

  // Handle initial setup
  const handleSetup = () => {
    const water = parseInt(waterUsageInput);
    if (!water || water <= 0) {
      alert('Please enter a valid water usage');
      return;
    }

    setWaterUsage(water);
    
    // Set realistic appliance values - user can toggle them
    setAppliances([
      { id: '1', name: 'Air Conditioner', icon: '❄️', consumption: 120, isOn: true, cost: 120 * ELECTRICITY_RATE },
      { id: '2', name: 'Refrigerator', icon: '🧊', consumption: 45, isOn: true, cost: 45 * ELECTRICITY_RATE },
      { id: '3', name: 'Washing Machine', icon: '👕', consumption: 18, isOn: true, cost: 18 * ELECTRICITY_RATE },
      { id: '4', name: 'Lights (LED)', icon: '💡', consumption: 25, isOn: true, cost: 25 * ELECTRICITY_RATE },
      { id: '5', name: 'Water Heater', icon: '🔥', consumption: 35, isOn: true, cost: 35 * ELECTRICITY_RATE },
    ]);
    
    setHasSetup(true);
    setStreakDays(1); // Start streak
  };

  // Calculate total consumption
  const totalElectricity = appliances
    .filter(a => a.isOn)
    .reduce((sum, a) => sum + a.consumption, 0);
  
  const totalElectricityCost = totalElectricity * ELECTRICITY_RATE;
  const totalWaterCost = waterUsage * WATER_RATE;
  const totalCost = totalElectricityCost + totalWaterCost;

  // Calculate progress
  const electricityProgress = totalElectricity <= electricityGoal 
    ? 100 
    : (electricityGoal / totalElectricity) * 100;

  // Toggle appliance
  const toggleAppliance = (id: string) => {
    setAppliances(prev => prev.map(a => 
      a.id === id ? { ...a, isOn: !a.isOn } : a
    ));
  };

  // Fetch AI cost recommendations
  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
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

      const response = await fetch('/api/urban/cost-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          country,
          electricityUsage: totalElectricity,
          waterUsage,
        }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Check if goal achieved
  useEffect(() => {
    if (hasSetup && totalElectricity <= electricityGoal && totalElectricity > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }, [totalElectricity, electricityGoal, hasSetup]);

  const getUsageColor = () => {
    if (totalElectricity <= electricityGoal) return 'text-green-600';
    if (totalElectricity <= electricityGoal * 1.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUsageStatus = () => {
    if (totalElectricity <= electricityGoal) return 'On Track! 🎉';
    if (totalElectricity <= electricityGoal * 1.2) return 'Almost There';
    return 'Over Target';
  };

  // Show setup form if not configured
  if (!hasSetup) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Smart Home Tracker - Setup
            </CardTitle>
            <CardDescription>
              Enter your monthly usage to start tracking
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Enter Your Monthly Usage</CardTitle>
            <CardDescription>
              We'll help you track and optimize your consumption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="waterUsage">Monthly Water Usage (Liters)</Label>
              <Input
                id="waterUsage"
                type="number"
                placeholder="e.g., 5000"
                value={waterUsageInput}
                onChange={(e) => setWaterUsageInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Average household: 3,000-8,000 liters/month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="electricityGoal">Monthly Electricity Goal (kWh)</Label>
              <Input
                id="electricityGoal"
                type="number"
                placeholder="e.g., 300"
                value={electricityGoal}
                onChange={(e) => setElectricityGoal(parseInt(e.target.value) || 300)}
              />
              <p className="text-xs text-muted-foreground">
                We'll show your appliance consumption and help you stay under this goal
              </p>
            </div>

            <Button onClick={handleSetup} className="w-full" size="lg">
              Start Tracking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Smart Home Tracker
              </CardTitle>
              <CardDescription>
                Monitor and optimize your home's resource consumption
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasSetup(false);
                setWaterUsageInput(waterUsage.toString());
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Settings
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Real-Time Dashboard */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Electricity Gauge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Electricity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <motion.p
                  key={totalElectricity}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-4xl font-bold ${getUsageColor()}`}
                >
                  {totalElectricity}
                </motion.p>
                <p className="text-sm text-muted-foreground">kWh/month</p>
                <p className="text-xs text-muted-foreground mt-1">{getUsageStatus()}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold">₹{totalElectricityCost.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Water Gauge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <Card className="border-2 border-cyan-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-600" />
                Water
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <p className="text-4xl font-bold text-cyan-600">{waterUsage}</p>
                <p className="text-sm text-muted-foreground">Liters/month</p>
                <p className="text-xs text-green-600 mt-1">Average usage ✓</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold">₹{totalWaterCost.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Cost */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-4 w-4 text-purple-600" />
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <motion.p
                  key={totalCost}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold text-purple-600"
                >
                  ₹{totalCost.toLocaleString()}
                </motion.p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Electricity</span>
                  <span className="font-medium">₹{totalElectricityCost}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Water</span>
                  <span className="font-medium">₹{totalWaterCost}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Usage Goal */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Monthly Electricity Goal
            </CardTitle>
            <Badge variant={totalElectricity <= electricityGoal ? "default" : "secondary"}>
              {Math.round(electricityProgress)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Current: {totalElectricity} kWh</span>
              <span>Goal: {electricityGoal} kWh</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                className={`h-4 rounded-full ${
                  totalElectricity <= electricityGoal 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-r from-red-500 to-orange-600'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(electricityProgress, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Streak Counter */}
          {streakDays > 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <Award className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">{streakDays} Day Streak! 🔥</p>
                <p className="text-xs text-muted-foreground">Keep staying under your goal</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appliance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Appliance Breakdown
          </CardTitle>
          <CardDescription>Toggle appliances to see impact on consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {appliances.map((appliance, index) => (
                <motion.div
                  key={appliance.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    appliance.isOn 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{appliance.icon}</span>
                      <div>
                        <p className="font-semibold">{appliance.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {appliance.consumption} kWh/month
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={appliance.isOn}
                      onCheckedChange={() => toggleAppliance(appliance.id)}
                    />
                  </div>
                  {appliance.isOn && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Cost</span>
                        <span className="font-bold text-blue-600">₹{appliance.cost}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Turn off to save ₹{appliance.cost}/month
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* AI Cost Optimization */}
      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-indigo-600" />
                AI Cost Optimization
              </CardTitle>
              <CardDescription>Get personalized savings recommendations</CardDescription>
            </div>
            <Button onClick={fetchRecommendations} disabled={loadingRecommendations} size="sm">
              {loadingRecommendations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Recommendations'
              )}
            </Button>
          </div>
        </CardHeader>
        {recommendations.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-indigo-50 rounded-lg border border-indigo-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-indigo-900">{rec.title}</h4>
                    <Badge variant="outline" className="text-green-600">
                      Save {rec.savings}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.action}</p>
                  <Badge variant="secondary" className="text-xs">{rec.category}</Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
