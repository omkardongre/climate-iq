"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DynamicResourceSection from "@/components/DynamicResourceSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Calculator,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Leaf,
} from "lucide-react";

interface WaterStrategy {
  strategy: string;
  waterSavings: number; // ML per year
  costSavings: number; // AUD per year
  implementation: string;
  paybackPeriod: string;
  difficulty: "Easy" | "Medium" | "Hard";
  priority: "High" | "Medium" | "Low";
  description: string;
  steps: string[];
}

interface FarmWaterData {
  farmSize: number;
  currentUsage: number; // ML per year
  waterSource: string;
  cropTypes: string[];
  irrigationSystem: string;
  region: string;
}

const waterSources = [
  { value: "bore", label: "Bore Water" },
  { value: "river", label: "River/Creek" },
  { value: "dam", label: "Farm Dam" },
  { value: "town", label: "Town Water" },
  { value: "rainwater", label: "Rainwater Harvesting" },
  { value: "recycled", label: "Recycled Water" },
];

const irrigationSystems = [
  { value: "flood", label: "Flood Irrigation" },
  { value: "sprinkler", label: "Sprinkler System" },
  { value: "drip", label: "Drip Irrigation" },
  { value: "centre-pivot", label: "Centre Pivot" },
  { value: "lateral-move", label: "Lateral Move" },
  { value: "none", label: "No Irrigation" },
];

export function WaterConservationStrategy() {
  const [farmData, setFarmData] = useState<FarmWaterData>({
    farmSize: 0,
    currentUsage: 0,
    waterSource: "",
    cropTypes: [],
    irrigationSystem: "",
    region: "",
  });

  const [strategies, setStrategies] = useState<WaterStrategy[]>([]);
  const [loading, setLoading] = useState(false);

  const generateStrategies = async () => {
    if (!farmData.waterSource || !farmData.irrigationSystem) return;

    setLoading(true);

    try {
      // Get selected location from browser storage
      const selectedLocationObj = localStorage.getItem("climateIQ-location");
      const selectedCountry = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : "USA";

      // Use Gemini AI to generate water conservation strategies
      const response = await fetch("/api/water-conservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertySize: farmData.farmSize,
          currentUsage: farmData.currentUsage,
          waterSources: farmData.waterSource,
          region: farmData.region,
          selectedCountry: selectedCountry,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Water conservation API response:", data);

        // Handle the API response structure
        if (
          data.conservation_strategies &&
          Array.isArray(data.conservation_strategies)
        ) {
          const mappedStrategies = data.conservation_strategies.map(
            (strategy: any) => ({
              strategy: strategy.strategy,
              waterSavings: strategy.annual_savings_liters / 1000, // Convert L to kL (kiloliters)
              costSavings: strategy.annual_savings_dollars,
              implementation: `$${strategy.implementation_cost}`,
              paybackPeriod: `${strategy.payback_period_months} months`,
              difficulty:
                strategy.difficulty === "easy"
                  ? "Easy"
                  : strategy.difficulty === "moderate"
                  ? "Medium"
                  : "Hard",
              priority:
                strategy.priority === "high"
                  ? "High"
                  : strategy.priority === "medium"
                  ? "Medium"
                  : "Low",
              description: strategy.description,
              steps: [strategy.description], // Use description as a single step for now
            })
          );
          setStrategies(mappedStrategies);
        } else {
          setStrategies(data.strategies || []);
        }
      } else {
        // Fallback to mock data
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const allStrategies: WaterStrategy[] = [
          {
            strategy: "Upgrade to Drip Irrigation",
            waterSavings: farmData.currentUsage * 0.4, // 40% savings
            costSavings: farmData.currentUsage * 0.4 * 1200, // $1200/ML saved
            implementation: "$15,000-25,000 per hectare",
            paybackPeriod: "3-5 years",
            difficulty: "Medium",
            priority: "High",
            description:
              "Replace flood/sprinkler irrigation with precision drip systems for maximum water efficiency.",
            steps: [
              "Conduct soil and topography survey",
              "Design drip system layout with agronomist",
              "Install main lines and filtration system",
              "Set up automated scheduling and monitoring",
              "Train staff on system operation and maintenance",
            ],
          },
          {
            strategy: "Install Soil Moisture Sensors",
            waterSavings: farmData.currentUsage * 0.25, // 25% savings
            costSavings: farmData.currentUsage * 0.25 * 1200,
            implementation: "$200-500 per sensor",
            paybackPeriod: "1-2 years",
            difficulty: "Easy",
            priority: "High",
            description:
              "Use precision sensors to optimize irrigation timing and prevent over-watering.",
            steps: [
              "Install sensors at multiple depths (30cm, 60cm, 90cm)",
              "Connect to automated irrigation controller",
              "Set up mobile app monitoring",
              "Calibrate for different crop growth stages",
              "Regular maintenance and battery replacement",
            ],
          },
          {
            strategy: "Rainwater Harvesting System",
            waterSavings: Math.min(50, farmData.farmSize * 0.5), // Up to 50ML or 0.5ML/ha
            costSavings: Math.min(50, farmData.farmSize * 0.5) * 800, // Lower cost water
            implementation: "$50,000-150,000",
            paybackPeriod: "5-8 years",
            difficulty: "Hard",
            priority: "Medium",
            description:
              "Capture and store rainwater from sheds and other surfaces for irrigation use.",
            steps: [
              "Calculate roof catchment area and annual rainfall",
              "Size storage tanks (consider 1ML per 100ha minimum)",
              "Install guttering, downpipes, and first-flush diverters",
              "Add filtration and pumping systems",
              "Integrate with existing irrigation infrastructure",
            ],
          },
          {
            strategy: "Mulching and Ground Cover",
            waterSavings: farmData.currentUsage * 0.15, // 15% savings
            costSavings: farmData.currentUsage * 0.15 * 1200,
            implementation: "$500-1,500 per hectare",
            paybackPeriod: "2-3 years",
            difficulty: "Easy",
            priority: "Medium",
            description:
              "Reduce evaporation and improve soil water retention with organic mulch or cover crops.",
            steps: [
              "Choose appropriate mulch material (straw, wood chips, plastic)",
              "Apply 5-10cm thick layer around plants",
              "Maintain mulch throughout growing season",
              "Consider living mulch with cover crops",
              "Monitor for pest harboring and adjust as needed",
            ],
          },
          {
            strategy: "Bore Water vs Town Water Analysis",
            waterSavings: 0, // Cost savings, not water savings
            costSavings:
              farmData.waterSource === "town"
                ? farmData.currentUsage * 2000
                : 0, // $2000/ML difference
            implementation: "$20,000-80,000 for bore",
            paybackPeriod: "2-4 years",
            difficulty: "Hard",
            priority: farmData.waterSource === "town" ? "High" : "Low",
            description:
              "Switch from expensive town water to bore water for significant cost savings.",
            steps: [
              "Conduct hydrogeological survey",
              "Apply for bore license with state water authority",
              "Drill and case bore to required depth",
              "Install pump and electrical connections",
              "Test water quality and implement treatment if needed",
            ],
          },
          {
            strategy: "Deficit Irrigation Strategy",
            waterSavings: farmData.currentUsage * 0.2, // 20% savings
            costSavings: farmData.currentUsage * 0.2 * 1200,
            implementation: "$2,000-5,000 for monitoring equipment",
            paybackPeriod: "1 year",
            difficulty: "Medium",
            priority: "High",
            description:
              "Apply controlled water stress during non-critical growth periods to save water with minimal yield impact.",
            steps: [
              "Identify crop growth stages and water sensitivity",
              "Install plant stress monitoring equipment",
              "Develop irrigation scheduling based on crop coefficients",
              "Monitor yield impacts and adjust strategy",
              "Train irrigation operators on deficit principles",
            ],
          },
        ];

        // Filter strategies based on current system and conditions
        let relevantStrategies = allStrategies.filter((strategy) => {
          if (
            strategy.strategy.includes("Drip") &&
            farmData.irrigationSystem === "drip"
          )
            return false;
          if (
            strategy.strategy.includes("Bore") &&
            farmData.waterSource === "bore"
          )
            return false;
          return true;
        });

        // Sort by priority and potential savings
        relevantStrategies.sort((a, b) => {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          return (
            priorityOrder[b.priority] - priorityOrder[a.priority] ||
            b.waterSavings - a.waterSavings
          );
        });

        setStrategies(relevantStrategies.slice(0, 4)); // Show top 4 strategies
      }
    } catch (error) {
      console.error("Error generating water conservation strategies:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "Hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Droplets className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Water Conservation Strategy
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          AI-powered water conservation strategies for farms worldwide. Optimize
          your water usage and reduce costs with personalized recommendations.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Farm Water Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="farm-size">Farm Size (hectares)</Label>
              <Input
                id="farm-size"
                type="number"
                value={farmData.farmSize}
                onChange={(e) =>
                  setFarmData((prev) => ({
                    ...prev,
                    farmSize: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 500"
              />
            </div>

            <div>
              <Label htmlFor="water-usage">Current Water Usage (ML/year)</Label>
              <Input
                id="water-usage"
                type="number"
                value={farmData.currentUsage}
                onChange={(e) =>
                  setFarmData((prev) => ({
                    ...prev,
                    currentUsage: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <Label htmlFor="water-source">Primary Water Source</Label>
              <Select
                value={farmData.waterSource}
                onValueChange={(value) =>
                  setFarmData((prev) => ({ ...prev, waterSource: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select water source" />
                </SelectTrigger>
                <SelectContent>
                  {waterSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="irrigation">Irrigation System</Label>
              <Select
                value={farmData.irrigationSystem}
                onValueChange={(value) =>
                  setFarmData((prev) => ({ ...prev, irrigationSystem: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select irrigation type" />
                </SelectTrigger>
                <SelectContent>
                  {irrigationSystems.map((system) => (
                    <SelectItem key={system.value} value={system.value}>
                      {system.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={farmData.region}
                onChange={(e) =>
                  setFarmData((prev) => ({
                    ...prev,
                    region: e.target.value,
                  }))
                }
                placeholder="e.g., Murray-Darling Basin"
              />
            </div>
          </div>

          <Button
            onClick={generateStrategies}
            disabled={
              loading || !farmData.waterSource || !farmData.irrigationSystem
            }
            className="mt-4"
          >
            {loading
              ? "Generating Strategies..."
              : "Generate Water Conservation Plan"}
          </Button>
        </CardContent>
      </Card>

      {/* Strategies */}
      {strategies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recommended Water Conservation Strategies
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategies.map((strategy, index) => {
              const strategyImages = {
                "Rainwater Harvesting":
                  "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                "Drip Irrigation":
                  "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                "Bore Water":
                  "linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fb923c 100%)",
                "Dam Construction":
                  "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)",
                Greywater:
                  "linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)",
                Mulching:
                  "linear-gradient(135deg, #92400e 0%, #d97706 50%, #f59e0b 100%)",
              };
              const getStrategyImage = (strategyName: string) => {
                if (!strategyName)
                  return "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #67e8f9 100%)";
                for (const [key, value] of Object.entries(strategyImages)) {
                  if (strategyName.includes(key)) return value;
                }
                return "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #67e8f9 100%)";
              };

              return (
                <Card
                  key={index}
                  className="border-l-4 border-l-blue-500 overflow-hidden"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {strategy.strategy}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge
                          className={`${getPriorityColor(
                            strategy.priority
                          )} text-white`}
                        >
                          {strategy.priority}
                        </Badge>
                        <Badge
                          className={`${getDifficultyColor(
                            strategy.difficulty
                          )} text-white`}
                        >
                          {strategy.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {strategy.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {strategy.waterSavings
                            ? strategy.waterSavings.toFixed(1)
                            : "0.0"}{" "}
                          kL
                        </div>
                        <div className="text-xs text-gray-500">
                          Water Saved/Year
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          $
                          {strategy.costSavings
                            ? strategy.costSavings.toLocaleString()
                            : "0"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost Saved/Year
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">
                          Implementation Cost:
                        </span>
                        <br />
                        {strategy.implementation}
                      </div>
                      <div>
                        <span className="font-semibold">Payback Period:</span>
                        <br />
                        {strategy.paybackPeriod}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-500" />
                        Implementation Steps
                      </h4>
                      <ul className="space-y-1">
                        {strategy.steps?.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            {step}
                          </li>
                        )) || (
                          <li className="text-sm text-gray-500">
                            No implementation steps available
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Resource Section */}
      <DynamicResourceSection
        featureName="water-conservation"
        fallbackContent={
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">
                Global Water Efficiency Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Government Programs</h4>
                  <ul className="space-y-1">
                    <li>• On-farm Irrigation Efficiency Program</li>
                    <li>• Murray-Darling Basin water efficiency grants</li>
                    <li>• State water infrastructure rebates</li>
                    <li>• Drought resilience funding</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Technical Support</h4>
                  <ul className="space-y-1">
                    <li>• Irrigation organizations</li>
                    <li>• Cotton Research & Development Corporation</li>
                    <li>• Grains Research & Development Corporation</li>
                    <li>• Local catchment management authorities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
