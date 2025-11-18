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
import { Tractor, Fuel, Calculator, TrendingDown, Leaf } from "lucide-react";

interface EquipmentData {
  type: string;
  hoursPerWeek: number;
  fuelType: "diesel" | "petrol" | "electric" | "solar";
  fuelConsumption: number; // L/hour for fuel, kWh/hour for electric
  area: number; // hectares
}

interface CarbonResult {
  // Primary fields
  annualCO2: number;
  weeklyCO2: number;
  fuelConsumption: number;
  annualCost: number;
  efficiency: string;
  recommendations: string[];
  alternatives?: Array<{
    name: string;
    co2Reduction: number;
    description: string;
    costImpact: string;
  }>;
  maintenanceTips?: string[];

  // Legacy fields for fallback compatibility
  weeklyEmissions: number;
  annualEmissions: number;
  costSavings: number;
  electricSavings: number;
  solarSavings: number;
}

const equipmentTypes = [
  { value: "tractor", label: "Tractor", consumption: 15 },
  { value: "harvester", label: "Harvester", consumption: 25 },
  { value: "seeder", label: "Seeder", consumption: 12 },
  { value: "sprayer", label: "Sprayer", consumption: 8 },
  { value: "mower", label: "Mower", consumption: 6 },
  { value: "cultivator", label: "Cultivator", consumption: 10 },
];

const fuelEmissionFactors = {
  diesel: 2.68, // kg CO2 per liter
  petrol: 2.31, // kg CO2 per liter
  electric: 0.82, // kg CO2 per kWh (global grid average)
  solar: 0.05, // kg CO2 per kWh (solar with manufacturing)
};

export function FarmEquipmentCalculator() {
  const [equipment, setEquipment] = useState<EquipmentData>({
    type: "",
    hoursPerWeek: 0,
    fuelType: "diesel",
    fuelConsumption: 15,
    area: 0,
  });
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateFootprint = async () => {
    setLoading(true);

    try {
      // Get selected location from browser storage
      const selectedLocationObj = localStorage.getItem("climateIQ-location");
      const selectedCountry = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : "USA";

      // Use Gemini AI to calculate farm equipment carbon footprint
      const response = await fetch("/api/farm-equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentType: equipment.type,
          fuelType: equipment.fuelType,
          hoursPerWeek: equipment.hoursPerWeek,
          farmSize: equipment.area,
          region: "global outback",
          selectedCountry: selectedCountry,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Map API response to component interface
        const weeklyEmissions =
          parseFloat(data.carbonFootprint?.weeklyEmissions) || 0;
        const annualEmissions =
          parseFloat(data.carbonFootprint?.annualEmissions) || 0;
        const fuelConsumption =
          parseFloat(data.carbonFootprint?.fuelConsumption) || 0;
        const costPerWeek = parseFloat(data.carbonFootprint?.costPerWeek) || 0;

        const mappedResult: CarbonResult = {
          // Map from API response structure with proper number conversion
          weeklyCO2: weeklyEmissions,
          annualCO2: annualEmissions,
          fuelConsumption: fuelConsumption,
          annualCost: costPerWeek * 52,
          efficiency: "Standard",
          recommendations: data.recommendations || [],
          alternatives: data.alternatives || [],
          maintenanceTips: data.efficiencyTips || [],

          // Legacy fields for compatibility
          weeklyEmissions: weeklyEmissions,
          annualEmissions: annualEmissions,
          costSavings: 0,
          electricSavings: 0,
          solarSavings: 0,
        };

        setResult(mappedResult);
      } else {
        // Fallback calculation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const weeklyFuelUse =
          equipment.hoursPerWeek * equipment.fuelConsumption;
        const emissionFactor = fuelEmissionFactors[equipment.fuelType];
        const weeklyEmissions = weeklyFuelUse * emissionFactor;
        const annualEmissions = weeklyEmissions * 52;

        // Calculate potential savings with electric/solar alternatives
        const dieselEmissions = weeklyFuelUse * fuelEmissionFactors.diesel * 52;
        const electricEmissions =
          weeklyFuelUse * 0.8 * fuelEmissionFactors.electric * 52; // 80% efficiency
        const solarEmissions =
          weeklyFuelUse * 0.8 * fuelEmissionFactors.solar * 52;

        const electricSavings = Math.max(
          0,
          dieselEmissions - electricEmissions
        );
        const solarSavings = Math.max(0, dieselEmissions - solarEmissions);

        // Cost calculations (global prices)
        const dieselCostPerLiter = 1.65;
        const electricityRate = 0.28; // per kWh
        const annualFuelCost = weeklyFuelUse * 52 * dieselCostPerLiter;
        const annualElectricCost = weeklyFuelUse * 0.8 * 52 * electricityRate;
        const costSavings = Math.max(0, annualFuelCost - annualElectricCost);

        const recommendations = [];

        if (equipment.fuelType === "diesel") {
          if (electricSavings > 500) {
            recommendations.push(
              `Switch to electric equipment to save ${electricSavings.toFixed(
                0
              )}kg CO₂ annually`
            );
          }
          if (solarSavings > 800) {
            recommendations.push(
              `Consider solar-powered equipment to save ${solarSavings.toFixed(
                0
              )}kg CO₂ annually`
            );
          }
        }

        if (equipment.hoursPerWeek > 20) {
          recommendations.push(
            "Consider GPS guidance systems to reduce fuel consumption by 5-10%"
          );
        }

        recommendations.push(
          "Regular maintenance can improve fuel efficiency by up to 15%"
        );
        recommendations.push(
          "Proper tire pressure reduces rolling resistance and fuel consumption"
        );

        setResult({
          annualCO2: annualEmissions,
          weeklyCO2: weeklyEmissions,
          annualEmissions,
          weeklyEmissions,
          fuelConsumption: weeklyFuelUse,
          annualCost: annualFuelCost,
          electricSavings,
          solarSavings,
          costSavings,
          recommendations,
          efficiency:
            annualEmissions < 1000
              ? "Good"
              : annualEmissions < 2000
              ? "Fair"
              : "Poor",
          maintenanceTips: [
            "Regularly service engines and maintain proper tire pressure",
            "Use the right equipment for the job to avoid overworking machinery",
            "Consider precision agriculture technologies to optimize inputs",
          ],
        });
      }
    } catch (error) {
      console.error("Error calculating farm equipment footprint:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentTypeChange = (value: string) => {
    const selectedEquipment = equipmentTypes.find((eq) => eq.value === value);
    setEquipment((prev) => ({
      ...prev,
      type: value,
      fuelConsumption: selectedEquipment?.consumption || 15,
    }));
  };

  return (
    <div className="space-y-6">
      {/* global Outback Header with Farm Equipment Theme */}
      <div
        className="relative h-32 bg-gradient-to-r from-green-100 via-yellow-100 to-orange-100 rounded-lg flex items-center justify-center mb-6"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #dcfce7 0%, #fef3c7 50%, #fed7aa 100%)",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black/10 rounded-lg"></div>
        <div className="relative z-10 flex items-center gap-3 text-center">
          <Tractor className="h-8 w-8 text-green-700" />
          <div>
            <h2 className="text-2xl font-bold text-green-900">
              Farm Equipment Carbon Calculator
            </h2>
            <p className="text-sm text-green-700">
              global Agricultural Efficiency Analysis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Equipment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipment-type">Equipment Type</Label>
              <Select
                value={equipment.type}
                onValueChange={handleEquipmentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((eq) => (
                    <SelectItem key={eq.value} value={eq.value}>
                      {eq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hours">Hours per Week</Label>
              <Input
                id="hours"
                type="number"
                value={equipment.hoursPerWeek}
                onChange={(e) =>
                  setEquipment((prev) => ({
                    ...prev,
                    hoursPerWeek: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 20"
              />
            </div>

            <div>
              <Label htmlFor="fuel-type">Fuel Type</Label>
              <Select
                value={equipment.fuelType}
                onValueChange={(
                  value: "diesel" | "petrol" | "electric" | "solar"
                ) => setEquipment((prev) => ({ ...prev, fuelType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="solar">Solar Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="consumption">
                {equipment.fuelType === "electric" ||
                equipment.fuelType === "solar"
                  ? "Power Consumption (kWh/hour)"
                  : "Fuel Consumption (L/hour)"}
              </Label>
              <Input
                id="consumption"
                type="number"
                value={equipment.fuelConsumption}
                onChange={(e) =>
                  setEquipment((prev) => ({
                    ...prev,
                    fuelConsumption: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 15"
              />
            </div>

            <div>
              <Label htmlFor="area">Farm Area (hectares) - Optional</Label>
              <Input
                id="area"
                type="number"
                value={equipment.area}
                onChange={(e) =>
                  setEquipment((prev) => ({
                    ...prev,
                    area: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 500"
              />
            </div>

            <Button
              onClick={calculateFootprint}
              disabled={loading || !equipment.type}
              className="w-full"
            >
              {loading ? "Calculating..." : "Calculate Carbon Footprint"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-500" />
                Carbon Footprint Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(typeof result.weeklyCO2 === "number"
                      ? result.weeklyCO2
                      : 0
                    ).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    kg CO₂ per week
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {(typeof result.annualCO2 === "number"
                      ? result.annualCO2
                      : 0
                    ).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    kg CO₂ per year
                  </div>
                </div>
              </div>

              {result.costSavings > 0 && result.costSavings !== undefined && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    $
                    {(typeof result.costSavings === "number"
                      ? result.costSavings
                      : 0
                    ).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Potential annual savings with electric
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dynamic Resource Section */}
      <DynamicResourceSection
        featureName="farm-equipment"
        fallbackContent={
          <Card className="bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-700 dark:text-gray-300">
                Farm Equipment Efficiency Guide Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Government Programs</h4>
                  <ul className="space-y-1">
                    <li>• Agricultural Equipment Tax Credits</li>
                    <li>• Clean Energy Equipment Rebates</li>
                    <li>• Farm Modernization Grants</li>
                    <li>• Sustainable Agriculture Incentives</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Industry Resources</h4>
                  <ul className="space-y-1">
                    <li>• Equipment Dealers Association</li>
                    <li>• Agricultural Machinery Manufacturers</li>
                    <li>• Farm Equipment Efficiency Standards</li>
                    <li>• Maintenance and Training Programs</li>
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
