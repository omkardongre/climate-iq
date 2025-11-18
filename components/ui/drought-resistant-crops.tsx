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
  Wheat,
  Droplets,
  Sun,
  MapPin,
  TrendingUp,
  Leaf,
  Clock,
} from "lucide-react";

interface CropRecommendation {
  name: string;
  variety: string;
  waterRequirement: "Low" | "Medium" | "High";
  droughtTolerance: "Excellent" | "Good" | "Fair";
  growingSeason: string;
  yieldPotential: string;
  marketValue: string;
  benefits: string[];
  plantingTips: string[];
}

interface FarmConditions {
  location: string;
  soilType: string;
  annualRainfall: number;
  irrigationAvailable: boolean;
  farmSize: number;
  currentCrops: string[];
}

const australianRegions = [
  { value: "wa-wheatbelt", label: "WA Wheatbelt" },
  { value: "sa-mallee", label: "SA Mallee" },
  { value: "nsw-riverina", label: "NSW Riverina" },
  { value: "qld-darling-downs", label: "QLD Darling Downs" },
  { value: "vic-wimmera", label: "VIC Wimmera" },
  { value: "nt-katherine", label: "NT Katherine Region" },
];

const soilTypes = [
  { value: "clay", label: "Clay" },
  { value: "sandy", label: "Sandy" },
  { value: "loam", label: "Loam" },
  { value: "sandy-clay", label: "Sandy Clay" },
  { value: "red-earth", label: "Red Earth" },
  { value: "black-soil", label: "Black Soil" },
];

export function DroughtResistantCrops() {
  const [conditions, setConditions] = useState<FarmConditions>({
    location: "",
    soilType: "",
    annualRainfall: 0,
    irrigationAvailable: false,
    farmSize: 0,
    currentCrops: [],
  });

  const [recommendations, setRecommendations] = useState<CropRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    if (!conditions.location || !conditions.soilType) return;

    setLoading(true);

    try {
      // Get selected location from browser storage
      const selectedLocationObj = localStorage.getItem("climateIQ-location");
      const selectedCountry = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : "USA";

      // Use Gemini AI to generate drought-resistant crop recommendations
      const response = await fetch("/api/drought-crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          region: conditions.location,
          soilType: conditions.soilType,
          rainfall: conditions.annualRainfall,
          farmSize: conditions.farmSize,
          currentCrops: conditions.currentCrops.join(", "),
          selectedCountry: selectedCountry,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Map API response to component interface
        if (data.recommendedCrops && Array.isArray(data.recommendedCrops)) {
          const mappedCrops = data.recommendedCrops.map((crop: any) => ({
            name: crop.name,
            variety: crop.variety,
            waterRequirement: crop.waterRequirement,
            droughtTolerance: "Excellent", // Default since API doesn't provide this
            growingSeason:
              crop.plantingTime || crop.harvestTime || "Season varies",
            yieldPotential: crop.yieldPotential,
            marketValue: crop.marketPrice || "Price varies",
            benefits: crop.advantages || [],
            plantingTips: crop.challenges || [],
          }));
          setRecommendations(mappedCrops);
        } else {
          setRecommendations(data.recommendedCrops || []);
        }
      } else {
        // Fallback to mock data
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock recommendations based on global conditions
        const mockRecommendations: CropRecommendation[] = [
          {
            name: "Sorghum",
            variety: "MR-Buster",
            waterRequirement: "Low",
            droughtTolerance: "Excellent",
            growingSeason: "Oct-Mar",
            yieldPotential: "4-6 tonnes/ha",
            marketValue: "$280-320/tonne",
            benefits: [
              "Extremely drought tolerant",
              "Deep root system accesses subsoil moisture",
              "Heat stress resistant",
              "Good livestock feed option",
            ],
            plantingTips: [
              "Plant after soil temperature reaches 16°C",
              "Optimal row spacing: 50-75cm",
              "Seed depth: 2-4cm depending on soil moisture",
              "Consider strip-till to conserve moisture",
            ],
          },
          {
            name: "Chickpeas",
            variety: "PBA HatTrick",
            waterRequirement: "Low",
            droughtTolerance: "Good",
            growingSeason: "May-Nov",
            yieldPotential: "1.5-2.5 tonnes/ha",
            marketValue: "$650-800/tonne",
            benefits: [
              "Nitrogen fixation improves soil",
              "High protein content",
              "Good rotation crop",
              "Premium export market",
            ],
            plantingTips: [
              "Inoculate seed with rhizobia",
              "Plant 3-5cm deep in moisture",
              "Avoid waterlogged soils",
              "Monitor for pod borer",
            ],
          },
          {
            name: "Wheat",
            variety: "Scepter",
            waterRequirement: "Medium",
            droughtTolerance: "Good",
            growingSeason: "May-Dec",
            yieldPotential: "2-4 tonnes/ha",
            marketValue: "$320-380/tonne",
            benefits: [
              "Improved drought tolerance",
              "Disease resistance package",
              "Good milling quality",
              "Reliable market demand",
            ],
            plantingTips: [
              "Early sowing for moisture utilization",
              "Precision seeding at 2-3cm depth",
              "Consider starter fertilizer",
              "Monitor crown rot in rotation",
            ],
          },
          {
            name: "Lucerne",
            variety: "SARDI 7 Series",
            waterRequirement: "Medium",
            droughtTolerance: "Excellent",
            growingSeason: "Perennial",
            yieldPotential: "8-15 tonnes/ha",
            marketValue: "$250-350/tonne",
            benefits: [
              "Deep taproot (3-4m)",
              "Perennial - long-term investment",
              "High quality livestock feed",
              "Soil improvement through nitrogen fixation",
            ],
            plantingTips: [
              "Establish in autumn with good moisture",
              "Lime acid soils to pH 6.5+",
              "Inoculate with specific rhizobia",
              "Allow establishment year before heavy grazing",
            ],
          },
        ];

        // Filter recommendations based on conditions
        let filteredRecs = mockRecommendations;

        if (conditions.annualRainfall < 300) {
          filteredRecs = filteredRecs.filter(
            (crop) =>
              crop.waterRequirement === "Low" &&
              crop.droughtTolerance === "Excellent"
          );
        } else if (conditions.annualRainfall < 500) {
          filteredRecs = filteredRecs.filter(
            (crop) => crop.waterRequirement !== "High"
          );
        }

        setRecommendations(filteredRecs);
      }
    } catch (error) {
      console.error("Error generating crop recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case "Excellent":
        return "bg-green-500";
      case "Good":
        return "bg-yellow-500";
      case "Fair":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getWaterColor = (requirement: string) => {
    switch (requirement) {
      case "Low":
        return "bg-blue-500";
      case "Medium":
        return "bg-blue-400";
      case "High":
        return "bg-blue-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Wheat className="h-10 w-10 text-amber-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Drought-Resistant Crops
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          AI-powered crop recommendations for global conditions. Get
          personalized suggestions based on your soil type, rainfall, and
          regional conditions.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Farm Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Region</Label>
              <Input
                id="location"
                value={conditions.location}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder=""
              />
            </div>

            <div>
              <Label htmlFor="soil">Soil Type</Label>
              <Select
                value={conditions.soilType}
                onValueChange={(value) =>
                  setConditions((prev) => ({ ...prev, soilType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  {soilTypes.map((soil) => (
                    <SelectItem key={soil.value} value={soil.value}>
                      {soil.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rainfall">Annual Rainfall (mm)</Label>
              <Input
                id="rainfall"
                type="number"
                value={conditions.annualRainfall}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    annualRainfall: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 350"
              />
            </div>

            <div>
              <Label htmlFor="farm-size">Farm Size (hectares)</Label>
              <Input
                id="farm-size"
                type="number"
                value={conditions.farmSize}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    farmSize: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 1000"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="irrigation"
                checked={conditions.irrigationAvailable}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    irrigationAvailable: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="irrigation">Irrigation Available</Label>
            </div>
          </div>

          <Button
            onClick={generateRecommendations}
            disabled={loading || !conditions.location || !conditions.soilType}
            className="mt-4"
          >
            {loading ? "Analyzing Conditions..." : "Get Crop Recommendations"}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recommended Crops for Your Conditions
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((crop, index) => {
              const cropImages: Record<string, string> = {
                Sorghum:
                  "linear-gradient(135deg, #92400e 0%, #d97706 50%, #fbbf24 100%)",
                Chickpea:
                  "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)",
                Safflower:
                  "linear-gradient(135deg, #dc2626 0%, #f59e0b 50%, #fbbf24 100%)",
                Millet:
                  "linear-gradient(135deg, #a16207 0%, #ca8a04 50%, #eab308 100%)",
                Canola:
                  "linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)",
                Barley:
                  "linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)",
                "Oldman Saltbush":
                  "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)",
                "Woolly Pod Vetch":
                  "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
              };
              const cropImage =
                cropImages[crop.name] ||
                "linear-gradient(135deg, #78716c 0%, #a8a29e 50%, #d6d3d1 100%)";

              return (
                <Card
                  key={index}
                  className="border-l-4 border-l-green-500 overflow-hidden"
                >
                  {/* Crop Image Placeholder */}
                  <div
                    className="h-24 flex items-center justify-center relative"
                    style={{ background: cropImage }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative z-10 text-center">
                      <Leaf className="h-6 w-6 text-white mx-auto mb-1" />
                      <p className="text-xs text-white font-medium">
                        {crop.name} Field
                      </p>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{crop.name}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Variety: {crop.variety}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          className={`${getToleranceColor(
                            crop.droughtTolerance
                          )} text-white`}
                        >
                          {crop.droughtTolerance}
                        </Badge>
                        <Badge
                          className={`${getWaterColor(
                            crop.waterRequirement
                          )} text-white`}
                        >
                          {crop.waterRequirement} Water
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{crop.growingSeason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>{crop.yieldPotential}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">$</span>
                        <span>{crop.marketValue}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-500" />
                        Key Benefits
                      </h4>
                      <ul className="space-y-1">
                        {(crop.benefits || []).map((benefit, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        Planting Tips
                      </h4>
                      <ul className="space-y-1">
                        {(crop.plantingTips || []).map((tip, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            {tip}
                          </li>
                        ))}
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
        featureName="drought-crops"
        fallbackContent={
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-300">
                Global Drought Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Government Support</h4>
                  <ul className="space-y-1">
                    <li>• Farm Household Allowance</li>
                    <li>• Drought Communities Programme</li>
                    <li>• Future Drought Fund initiatives</li>
                    <li>• State-specific drought assistance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Research & Extension</h4>
                  <ul className="space-y-1">
                    <li>• GRDC variety guides</li>
                    <li>• State agriculture departments</li>
                    <li>• CSIRO drought research</li>
                    <li>• Local agronomist networks</li>
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
