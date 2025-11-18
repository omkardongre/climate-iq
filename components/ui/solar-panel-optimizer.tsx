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
  Sun,
  Zap,
  DollarSign,
  TrendingUp,
  MapPin,
  Battery,
  Home,
} from "lucide-react";

interface SolarOptimization {
  recommendedCapacity: number; // kW
  annualGeneration: number; // kWh
  costSavings: number; // AUD per year
  co2Reduction: number; // kg per year
  paybackPeriod: number; // years
  roiPercentage: number;
  batteryRecommendation: string;
  panelType: string;
  inverterType: string;
  installationTips: string[];
  maintenanceSchedule: string[];
}

interface PropertyData {
  location: string;
  propertySize: number; // hectares
  currentElectricityBill: number; // AUD per month
  roofArea: number; // square meters
  shadingIssues: boolean;
  gridConnection: "connected" | "off-grid" | "poor";
  primaryUse: string;
}

const australianLocations = [
  { value: "alice-springs-nt", label: "Alice Springs, NT", solarHours: 8.9 },
  { value: "broken-hill-nsw", label: "Broken Hill, NSW", solarHours: 8.2 },
  { value: "kalgoorlie-wa", label: "Kalgoorlie, WA", solarHours: 8.1 },
  { value: "mount-isa-qld", label: "Mount Isa, QLD", solarHours: 7.8 },
  { value: "port-augusta-sa", label: "Port Augusta, SA", solarHours: 7.9 },
  { value: "tennant-creek-nt", label: "Tennant Creek, NT", solarHours: 8.7 },
  { value: "charleville-qld", label: "Charleville, QLD", solarHours: 7.6 },
  { value: "coober-pedy-sa", label: "Coober Pedy, SA", solarHours: 8.3 },
];

const propertyUses = [
  { value: "homestead", label: "Homestead/Residence" },
  { value: "cattle-station", label: "Cattle Station" },
  { value: "sheep-station", label: "Sheep Station" },
  { value: "crop-farm", label: "Crop Farm" },
  { value: "mining-operation", label: "Mining Operation" },
  { value: "tourism-lodge", label: "Tourism Lodge" },
];

export function SolarPanelOptimizer() {
  const [propertyData, setPropertyData] = useState<PropertyData>({
    location: "",
    propertySize: 0,
    currentElectricityBill: 0,
    roofArea: 0,
    shadingIssues: false,
    gridConnection: "connected",
    primaryUse: "",
  });

  const [optimization, setOptimization] = useState<SolarOptimization | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const optimizeSolarSetup = async () => {
    if (!propertyData.location || propertyData.currentElectricityBill <= 0)
      return;

    setLoading(true);

    try {
      // Get selected location from browser storage
      const selectedLocationObj = localStorage.getItem("climateIQ-location");
      const selectedCountry = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : "USA";

      // Use Gemini AI to optimize solar panel setup
      const response = await fetch("/api/solar-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertySize: propertyData.propertySize,
          roofArea: propertyData.roofArea,
          energyUsage: propertyData.currentElectricityBill * 3, // Approximate kWh from bill
          location: propertyData.location,
          budget: null,
          selectedCountry: selectedCountry,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Map API response to component interface
        const panelCapacity = parseFloat(
          data.systemRecommendation?.panelCapacity
            ?.toString()
            .replace(/[^\d.]/g, "") || "0"
        );
        const annualGeneration = parseFloat(
          data.energyProduction?.annualGeneration
            ?.toString()
            .replace(/[^\d.]/g, "") || "0"
        );
        const annualSavings = parseFloat(
          data.financialAnalysis?.annualSavings
            ?.toString()
            .replace(/[^\d.]/g, "") || "0"
        );
        const totalInvestment = parseFloat(
          data.financialAnalysis?.totalInvestment
            ?.toString()
            .replace(/[^\d.]/g, "") || "1"
        );
        const roi25Years = parseFloat(
          data.financialAnalysis?.roi25Years
            ?.toString()
            .replace(/[^\d.]/g, "") || "0"
        );

        const mappedOptimization: SolarOptimization = {
          recommendedCapacity: panelCapacity,
          annualGeneration: annualGeneration,
          costSavings: annualSavings,
          co2Reduction: Math.round(annualGeneration * 0.82), // Global grid factor kg CO2/kWh
          paybackPeriod: parseFloat(
            data.financialAnalysis?.paybackPeriod
              ?.toString()
              .replace(/[^\d.]/g, "") || "0"
          ),
          roiPercentage:
            totalInvestment > 0
              ? Math.round((roi25Years / totalInvestment) * 100)
              : 0,
          batteryRecommendation: `${
            data.systemRecommendation?.batteryCapacity || 0
          } battery recommended`,
          panelType: data.systemRecommendation?.panelType || "Monocrystalline",
          inverterType: `${
            data.systemRecommendation?.inverterSize || 0
          } inverter`,
          installationTips:
            data.installationGuidance?.shadingConsiderations || [],
          maintenanceSchedule: data.maintenanceSchedule || [],
        };

        setOptimization(mappedOptimization);
      } else {
        // Fallback calculation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const locationData = australianLocations.find(
          (loc) => loc.value === propertyData.location
        );
        const solarHours = locationData?.solarHours || 7.5;

        // Calculate optimal system size based on usage and available space
        const annualUsage = (propertyData.currentElectricityBill * 12) / 0.28; // Assuming $0.28/kWh
        const maxRoofCapacity = propertyData.roofArea * 0.15; // 150W per m²
        const optimalCapacity = Math.min(
          annualUsage / (solarHours * 365),
          maxRoofCapacity
        );

        // Adjust for outback conditions
        const outbackMultiplier =
          propertyData.gridConnection === "off-grid" ? 1.5 : 1.2;
        const recommendedCapacity = Math.round(
          optimalCapacity * outbackMultiplier
        );

        const annualGeneration = recommendedCapacity * solarHours * 365 * 0.85; // 85% system efficiency
        const electricityRate =
          propertyData.gridConnection === "off-grid" ? 0.45 : 0.28; // Higher diesel gen costs
        const costSavings =
          Math.min(annualGeneration, annualUsage) * electricityRate;

        // CO2 reduction (Global grid average: 0.82 kg CO2/kWh)
        const co2Reduction = annualGeneration * 0.82;

        // Cost calculations
        const systemCost =
          recommendedCapacity *
          (propertyData.gridConnection === "off-grid" ? 4500 : 2800); // Higher costs for remote areas
        const paybackPeriod = systemCost / costSavings;
        const roiPercentage = (costSavings / systemCost) * 100;

        // Battery recommendation for outback properties
        let batteryRecommendation = "Not required for grid-connected systems";
        if (propertyData.gridConnection === "off-grid") {
          const batteryCapacity = Math.round(recommendedCapacity * 8); // 8 hours storage
          batteryRecommendation = `${batteryCapacity}kWh lithium battery bank recommended for off-grid operation`;
        } else if (propertyData.gridConnection === "poor") {
          batteryRecommendation =
            "20-40kWh backup battery recommended for grid instability";
        }

        // Panel and inverter recommendations
        const panelType =
          propertyData.gridConnection === "off-grid"
            ? "Monocrystalline panels (higher efficiency for limited space)"
            : "Polycrystalline panels (cost-effective for large installations)";

        const inverterType =
          propertyData.gridConnection === "off-grid"
            ? "Hybrid inverter with battery management"
            : "Grid-tie inverter with monitoring";

        const installationTips = [
          "Orient panels north-facing for maximum sun exposure",
          "Tilt angle should match latitude (Alice Springs: 23.7°)",
          "Ensure adequate ventilation behind panels for cooling",
          "Use cyclone-rated mounting systems for extreme weather",
          "Install bird and pest protection mesh",
          "Consider ground-mount systems for large properties",
        ];

        if (propertyData.shadingIssues) {
          installationTips.push(
            "Use power optimizers or microinverters to minimize shading impact"
          );
        }

        if (propertyData.gridConnection === "off-grid") {
          installationTips.push(
            "Install backup diesel generator for extended cloudy periods"
          );
          installationTips.push(
            "Size system 20-30% larger to account for battery losses"
          );
        }

        const maintenanceSchedule = [
          "Monthly: Visual inspection for damage or debris",
          "Quarterly: Clean panels (more frequent in dusty conditions)",
          "Bi-annually: Check electrical connections and inverter performance",
          "Annually: Professional system inspection and testing",
          "As needed: Trim vegetation to prevent shading",
        ];

        if (propertyData.gridConnection === "off-grid") {
          maintenanceSchedule.push(
            "Monthly: Check battery voltage and electrolyte levels"
          );
          maintenanceSchedule.push(
            "Annually: Battery capacity testing and replacement planning"
          );
        }

        setOptimization({
          recommendedCapacity,
          annualGeneration: Math.round(annualGeneration),
          costSavings: Math.round(costSavings),
          co2Reduction: Math.round(co2Reduction),
          paybackPeriod: Math.round(paybackPeriod * 10) / 10,
          roiPercentage: Math.round(roiPercentage * 10) / 10,
          batteryRecommendation,
          panelType,
          inverterType,
          installationTips,
          maintenanceSchedule,
        });
      }
    } catch (error) {
      console.error("Error optimizing solar system:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaybackColor = (years: number) => {
    if (years <= 5) return "text-green-600 dark:text-green-400";
    if (years <= 8) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sun className="h-10 w-10 text-yellow-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Solar Panel System Optimizer
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          AI-powered solar optimization for properties worldwide. Get
          personalized recommendations for maximum energy efficiency and cost
          savings.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={propertyData.location}
                onChange={(e) =>
                  setPropertyData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder=""
              />
            </div>

            <div>
              <Label htmlFor="property-size">Property Size (hectares)</Label>
              <Input
                id="property-size"
                type="number"
                value={propertyData.propertySize}
                onChange={(e) =>
                  setPropertyData((prev) => ({
                    ...prev,
                    propertySize: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 10000"
              />
            </div>

            <div>
              <Label htmlFor="electricity-bill">Monthly Electricity Bill</Label>
              <Input
                id="electricity-bill"
                type="number"
                value={propertyData.currentElectricityBill}
                onChange={(e) =>
                  setPropertyData((prev) => ({
                    ...prev,
                    currentElectricityBill: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 800"
              />
            </div>

            <div>
              <Label htmlFor="roof-area">Available Roof Area (m²)</Label>
              <Input
                id="roof-area"
                type="number"
                value={propertyData.roofArea}
                onChange={(e) =>
                  setPropertyData((prev) => ({
                    ...prev,
                    roofArea: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 200"
              />
            </div>

            <div>
              <Label htmlFor="grid-connection">Grid Connection</Label>
              <Select
                value={propertyData.gridConnection}
                onValueChange={(value: "connected" | "off-grid" | "poor") =>
                  setPropertyData((prev) => ({
                    ...prev,
                    gridConnection: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Grid Connected</SelectItem>
                  <SelectItem value="poor">Poor Grid Connection</SelectItem>
                  <SelectItem value="off-grid">Off-Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="primary-use">Primary Use</Label>
              <Select
                value={propertyData.primaryUse}
                onValueChange={(value) =>
                  setPropertyData((prev) => ({ ...prev, primaryUse: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property use" />
                </SelectTrigger>
                <SelectContent>
                  {propertyUses.map((use) => (
                    <SelectItem key={use.value} value={use.value}>
                      {use.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shading"
                checked={propertyData.shadingIssues}
                onChange={(e) =>
                  setPropertyData((prev) => ({
                    ...prev,
                    shadingIssues: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="shading">Significant Shading Issues</Label>
            </div>
          </div>

          <Button
            onClick={optimizeSolarSetup}
            disabled={
              loading ||
              !propertyData.location ||
              propertyData.currentElectricityBill <= 0
            }
            className="mt-4"
          >
            {loading ? "Optimizing Solar Setup..." : "Optimize Solar System"}
          </Button>
        </CardContent>
      </Card>

      {/* Optimization Results */}

      {optimization && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Optimized Solar System Recommendation
          </h3>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {optimization?.recommendedCapacity || 0}kW
                </div>
                <div className="text-sm text-gray-500">
                  Recommended Capacity
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {optimization?.annualGeneration?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-500">kWh Generated/Year</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${optimization?.costSavings?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-500">Annual Savings</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div
                  className={`text-2xl font-bold ${getPaybackColor(
                    optimization?.paybackPeriod || 0
                  )}`}
                >
                  {optimization?.paybackPeriod || 0} years
                </div>
                <div className="text-sm text-gray-500">Payback Period</div>
              </CardContent>
            </Card>
          </div>

          {/* System Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-green-500" />
                  System Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Panel Recommendation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {optimization.panelType}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Inverter Type</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {optimization.inverterType}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Battery Storage</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {optimization.batteryRecommendation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {optimization.roiPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">Annual ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {(optimization.co2Reduction / 1000).toFixed(1)}t
                    </div>
                    <div className="text-xs text-gray-500">CO₂ Saved/Year</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Installation Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {optimization.installationTips?.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {optimization.maintenanceSchedule.map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    {task}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Resource Section */}
      <DynamicResourceSection
        featureName="solar-optimizer"
        fallbackContent={
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-300">
                Global Solar Resources & Incentives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Government Incentives</h4>
                  <ul className="space-y-1">
                    <li>• Small-scale Renewable Energy Scheme (SRES)</li>
                    <li>• State-based solar rebates and feed-in tariffs</li>
                    <li>• Remote Area Power Supply (RAPS) programs</li>
                    <li>• Clean Energy Finance Corporation loans</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Technical Support</h4>
                  <ul className="space-y-1">
                    <li>• Clean Energy Council accredited installers</li>
                    <li>• Solar Council resources</li>
                    <li>• ARENA research and development funding</li>
                    <li>• Local energy efficiency programs</li>
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
