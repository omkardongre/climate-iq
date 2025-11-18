"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { SimulationResult } from "@/lib/climate-simulator"
import { Calculator, TrendingUp, Zap, Users, Globe, Target, Lightbulb, Leaf } from "lucide-react"

interface SimulationParams {
  transport_reduction: number
  energy_efficiency: number
  diet_change: number
  waste_reduction: number
  community_size: number
  time_horizon: string
}

// Remove local interface since we're importing from climate-simulator

export function ActionSimulator() {
  const [params, setParams] = useState<SimulationParams>({
    transport_reduction: 30,
    energy_efficiency: 25,
    diet_change: 20,
    waste_reduction: 40,
    community_size: 100,
    time_horizon: "1_year",
  })

  const [results, setResults] = useState<SimulationResult | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeScenario, setActiveScenario] = useState("custom")

  const predefinedScenarios = {
    conservative: {
      transport_reduction: 15,
      energy_efficiency: 10,
      diet_change: 5,
      waste_reduction: 20,
      community_size: 50,
      time_horizon: "1_year",
    },
    moderate: {
      transport_reduction: 30,
      energy_efficiency: 25,
      diet_change: 20,
      waste_reduction: 40,
      community_size: 100,
      time_horizon: "1_year",
    },
    ambitious: {
      transport_reduction: 60,
      energy_efficiency: 50,
      diet_change: 40,
      waste_reduction: 70,
      community_size: 250,
      time_horizon: "1_year",
    },
  }

  const runSimulation = async () => {
    setIsSimulating(true)

    try {
      console.log('Action Simulator: Starting simulation with params:', params)
      // Real AI-powered climate simulation
      const { climateSimulator } = await import("@/lib/climate-simulator")
      
      const simulationData = await climateSimulator.runSimulation({
        transport_reduction: params.transport_reduction,
        energy_efficiency: params.energy_efficiency,
        diet_change: params.diet_change,
        waste_reduction: params.waste_reduction,
        community_size: params.community_size,
        time_horizon: params.time_horizon,
        location: "Global", // Could be enhanced with user location
        current_lifestyle: "mixed"
      })

      console.log('Action Simulator: Received simulation data:', simulationData)
      setResults(simulationData)
    } catch (error) {
      console.error('Simulation error:', error)
      // Fallback to basic calculation if AI fails
      await runFallbackSimulation()
    } finally {
      setIsSimulating(false)
    }
  }

  const runFallbackSimulation = async () => {
    // Enhanced fallback simulation
    const timeMultiplier = getTimeMultiplier(params.time_horizon)
    const transportSavings = (params.transport_reduction / 100) * 4800
    const energySavings = (params.energy_efficiency / 100) * 3200
    const dietSavings = (params.diet_change / 100) * 2400
    const wasteSavings = (params.waste_reduction / 100) * 800

    const totalPersonalSavings = transportSavings + energySavings + dietSavings + wasteSavings
    const timelineData = generateTimelineData(params, totalPersonalSavings, timeMultiplier)
    const breakdownData = [
      { category: "Transport", impact: transportSavings * timeMultiplier, color: "#ef4444" },
      { category: "Energy", impact: energySavings * timeMultiplier, color: "#f97316" },
      { category: "Diet", impact: dietSavings * timeMultiplier, color: "#eab308" },
      { category: "Waste", impact: wasteSavings * timeMultiplier, color: "#22c55e" },
    ]

    const simulationResult: SimulationResult = {
      personal_impact: {
        co2_saved: totalPersonalSavings * timeMultiplier,
        cost_savings: totalPersonalSavings * 0.08 * timeMultiplier,
        health_benefits: Math.min(95, ((transportSavings + dietSavings) / 16000) * 100),
      },
      community_impact: {
        total_co2_saved: totalPersonalSavings * params.community_size * timeMultiplier,
        economic_impact: totalPersonalSavings * params.community_size * 0.08 * timeMultiplier,
        environmental_score: Math.min(100, (totalPersonalSavings / 16000) * 100),
      },
      timeline_data: timelineData,
      breakdown_data: breakdownData,
      insights: {
        biggest_impact: getBiggestImpactCategory(breakdownData),
        community_power: `With ${params.community_size} people, your collective impact is amplified significantly.`,
        scaled_context: getScaledContext(totalPersonalSavings * params.community_size * timeMultiplier),
        recommendations: getRecommendations(params)
      },
      confidence_score: 78
    }

    setResults(simulationResult)
  }

  const getTimeMultiplier = (timeHorizon: string) => {
    switch (timeHorizon) {
      case "1_week": return 1 / 52
      case "1_month": return 1 / 12
      case "1_year": return 1
      case "5_years": return 5
      case "10_years": return 10
      default: return 1
    }
  }

  const getBiggestImpactCategory = (breakdownData: Array<{category: string, impact: number, color: string}>) => {
    return breakdownData.reduce((max, current) => 
      current.impact > max.impact ? current : max
    ).category
  }

  const getScaledContext = (totalImpact: number) => {
    if (totalImpact > 100000) {
      return `This is equivalent to taking ${Math.round(totalImpact / 4200)} cars off the road for a year.`
    } else if (totalImpact > 10000) {
      return `This is equivalent to planting ${Math.round(totalImpact / 22)} trees.`
    } else {
      return `This is equivalent to ${Math.round(totalImpact / 400)} round-trip flights from NYC to Boston.`
    }
  }

  const getRecommendations = (params: SimulationParams) => {
    const recommendations = []
    if (params.transport_reduction < 50) {
      recommendations.push("Consider increasing public transport usage or cycling")
    }
    if (params.energy_efficiency < 40) {
      recommendations.push("Upgrade to LED lighting and energy-efficient appliances")
    }
    if (params.diet_change < 30) {
      recommendations.push("Try reducing meat consumption by one day per week")
    }
    if (params.waste_reduction < 60) {
      recommendations.push("Focus on composting and reducing single-use plastics")
    }
    return recommendations
  }

  const generateTimelineData = (params: SimulationParams, totalSavings: number, multiplier: number) => {
    const periods =
      params.time_horizon === "1_week"
        ? 7
        : params.time_horizon === "1_month"
          ? 4
          : params.time_horizon === "1_year"
            ? 12
            : params.time_horizon === "5_years"
              ? 5
              : 10

    return Array.from({ length: periods }, (_, i) => {
      const progress = (i + 1) / periods
      return {
        period:
          params.time_horizon === "1_week"
            ? `Day ${i + 1}`
            : params.time_horizon === "1_month"
              ? `Week ${i + 1}`
              : params.time_horizon === "1_year"
                ? `Month ${i + 1}`
                : `Year ${i + 1}`,
        personal_co2: totalSavings * progress * multiplier,
        community_co2: totalSavings * params.community_size * progress * multiplier,
        cumulative_savings: totalSavings * 0.05 * progress * multiplier,
      }
    })
  }

  const loadScenario = (scenario: keyof typeof predefinedScenarios) => {
    setParams(predefinedScenarios[scenario])
    setActiveScenario(scenario)
  }

  // Removed automatic simulation on parameter change

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Predictive Action Simulator
          </CardTitle>
          <CardDescription>
            Model the impact of your climate actions over time using AI-powered predictions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose Scenario</CardTitle>
          <CardDescription>Start with a predefined scenario or customize your own</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(predefinedScenarios).map(([key, scenario]) => (
              <Button
                key={key}
                variant={activeScenario === key ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => loadScenario(key as keyof typeof predefinedScenarios)}
              >
                <div className="font-semibold capitalize mb-1">{key} Approach</div>
                <div className="text-xs text-left opacity-70">
                  {key === "conservative" && "Small, achievable changes"}
                  {key === "moderate" && "Balanced lifestyle adjustments"}
                  {key === "ambitious" && "Significant lifestyle transformation"}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parameter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulation Parameters</CardTitle>
          <CardDescription>Adjust the sliders to model different action scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Transport Reduction</label>
                  <Badge variant="outline">{params.transport_reduction}%</Badge>
                </div>
                <Slider
                  value={[params.transport_reduction]}
                  onValueChange={(value) => {
                    setParams({ ...params, transport_reduction: value[0] })
                    setActiveScenario("custom")
                  }}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Public transport, cycling, electric vehicles, remote work</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Energy Efficiency</label>
                  <Badge variant="outline">{params.energy_efficiency}%</Badge>
                </div>
                <Slider
                  value={[params.energy_efficiency]}
                  onValueChange={(value) => {
                    setParams({ ...params, energy_efficiency: value[0] })
                    setActiveScenario("custom")
                  }}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">LED bulbs, insulation, smart thermostats, renewable energy</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Diet Changes</label>
                  <Badge variant="outline">{params.diet_change}%</Badge>
                </div>
                <Slider
                  value={[params.diet_change]}
                  onValueChange={(value) => {
                    setParams({ ...params, diet_change: value[0] })
                    setActiveScenario("custom")
                  }}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Plant-based meals, local produce, reduced food waste</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Waste Reduction</label>
                  <Badge variant="outline">{params.waste_reduction}%</Badge>
                </div>
                <Slider
                  value={[params.waste_reduction]}
                  onValueChange={(value) => {
                    setParams({ ...params, waste_reduction: value[0] })
                    setActiveScenario("custom")
                  }}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Recycling, composting, reusable items, minimal packaging</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Group Size</label>
              <Slider
                value={[params.community_size]}
                onValueChange={(value) => {
                  setParams({ ...params, community_size: value[0] })
                  setActiveScenario("custom")
                }}
                min={10}
                max={1000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>10 people</span>
                <span className="font-medium">{params.community_size} people</span>
                <span>1000 people</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Horizon</label>
              <Select
                value={params.time_horizon}
                onValueChange={(value) => {
                  setParams({ ...params, time_horizon: value })
                  setActiveScenario("custom")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_week">1 Week</SelectItem>
                  <SelectItem value="1_month">1 Month</SelectItem>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="5_years">5 Years</SelectItem>
                  <SelectItem value="10_years">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={runSimulation}
              disabled={isSimulating}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3"
            >
              {isSimulating ? (
                <>
                  <Zap className="mr-2 h-5 w-5 animate-pulse" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-5 w-5" />
                  Run Climate Simulation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSimulating ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Zap className="mx-auto h-12 w-12 text-orange-500 animate-pulse mb-4" />
              <p className="text-lg font-medium">Running AI Simulation...</p>
              <Progress value={60} className="w-64 mt-4" />
              <p className="text-sm text-gray-600 mt-2">Processing AI prediction models</p>
            </div>
          </CardContent>
        </Card>
      ) : results ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Impact Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">CO₂ Saved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(results.personal_impact.co2_saved / 1000).toFixed(1)}t
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Personal impact</p>
                    </div>
                    <Leaf className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cost Savings</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${results.personal_impact.cost_savings.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Financial benefit</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Health Score</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {results.personal_impact.health_benefits.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Wellness improvement</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Biggest Impact:</strong> Your transport changes could save{" "}
                    {((params.transport_reduction / 100) * 4.2).toFixed(1)} tons of CO₂ annually.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Group Power:</strong> With {params.community_size} people taking similar actions, you
                    could collectively save {(results.community_impact.total_co2_saved / 1000).toFixed(1)} tons of CO₂.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Global Context:</strong> This is equivalent to removing{" "}
                    {Math.round(results.community_impact.total_co2_saved / 4600)} cars from the road for a year.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Impact Over Time</CardTitle>
                <CardDescription>Projected CO₂ savings and cumulative benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={results.timeline_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(1)}t CO₂`, ""]} />
                    <Area
                      type="monotone"
                      dataKey="personal_co2"
                      stackId="1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="community_co2"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Impact by Category</CardTitle>
                  <CardDescription>CO₂ savings breakdown by action type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={results.breakdown_data || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="impact"
                        label={({ category, impact }) => `${category}: ${(impact / 1000).toFixed(1)}t`}
                      >
                        {results.breakdown_data?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        )) || []}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(1)}t CO₂`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Action Effectiveness</CardTitle>
                  <CardDescription>Relative impact of each action category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={results.breakdown_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(1)}t CO₂`, ""]} />
                      <Bar dataKey="impact" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Impact
                  </CardTitle>
                  <CardDescription>Collective results with {params.community_size} participants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total CO₂ Saved</span>
                    <Badge className="bg-green-100 text-green-800">
                      {(results.community_impact.total_co2_saved / 1000).toFixed(1)}t
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Economic Impact</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      ${results.community_impact.economic_impact.toFixed(0)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Environmental Score</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {results.community_impact.environmental_score.toFixed(0)}%
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Community Progress</span>
                      <span>{results.community_impact.environmental_score.toFixed(0)}%</span>
                    </div>
                    <Progress value={results.community_impact.environmental_score} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scaling Potential</CardTitle>
                  <CardDescription>What if more people joined your actions?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">500 people</span>
                      <span className="text-sm font-medium text-green-600">
                        {((results.community_impact.total_co2_saved * 5) / 1000).toFixed(1)}t CO₂
                      </span>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">1,000 people</span>
                      <span className="text-sm font-medium text-green-600">
                        {((results.community_impact.total_co2_saved * 10) / 1000).toFixed(1)}t CO₂
                      </span>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10,000 people</span>
                      <span className="text-sm font-medium text-green-600">
                        {((results.community_impact.total_co2_saved * 100) / 1000).toFixed(1)}t CO₂
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}
