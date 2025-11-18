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
  TreePine,
  Shield,
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Leaf,
} from "lucide-react";

interface HabitatRecommendation {
  id: string;
  title: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  category:
    | "Restoration"
    | "Protection"
    | "Connectivity"
    | "Monitoring"
    | "Community";
  description: string;
  targetSpecies: string[];
  timeframe: string;
  cost: string;
  difficulty: "Easy" | "Medium" | "Hard";
  steps: string[];
  expectedOutcomes: string[];
  fundingSources: string[];
}

interface PropertyAssessment {
  propertySize: number;
  region: string;
  habitatType: string;
  threatenedSpecies: boolean;
  waterSources: boolean;
  connectivity: string;
  currentManagement: string;
}

const habitatTypes = [
  { value: "woodland", label: "Woodland/Forest" },
  { value: "grassland", label: "Grassland/Prairie" },
  { value: "wetland", label: "Wetland/Riparian" },
  { value: "shrubland", label: "Shrubland/Scrub" },
  { value: "desert", label: "Desert/Arid" },
  { value: "coastal", label: "Coastal/Marine" },
  { value: "mixed", label: "Mixed Habitat" },
];

const connectivityLevels = [
  { value: "isolated", label: "Isolated - No nearby habitat" },
  { value: "fragmented", label: "Fragmented - Some nearby patches" },
  { value: "connected", label: "Well Connected - Part of corridor" },
  { value: "core", label: "Core Habitat - Large continuous area" },
];

export function HabitatProtectionRecommendations() {
  const [assessment, setAssessment] = useState<PropertyAssessment>({
    propertySize: 0,
    region: "",
    habitatType: "",
    threatenedSpecies: false,
    waterSources: false,
    connectivity: "",
    currentManagement: "",
  });

  const [recommendations, setRecommendations] = useState<
    HabitatRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    if (!assessment.region || !assessment.habitatType) return;

    setLoading(true);

    try {
      // Get selected location from browser storage
      const selectedLocationObj = localStorage.getItem("climateIQ-location");
      const selectedCountry = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : "USA";

      const response = await fetch("/api/habitat-protection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessment,
          selectedCountry: selectedCountry,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating habitat recommendations:", error);

      // Fallback to basic recommendations
      const fallbackRecommendations: HabitatRecommendation[] = [
        {
          id: "1",
          title: "Establish Native Vegetation Corridors",
          priority: "High",
          category: "Connectivity",
          description:
            "Create connected pathways of native vegetation to link habitat fragments and allow wildlife movement across the landscape.",
          targetSpecies: [
            "Native birds",
            "Small mammals",
            "Pollinators",
            "Reptiles",
          ],
          timeframe: "2-3 years",
          cost: "$8,000-25,000",
          difficulty: "Medium",
          steps: [
            "Map existing vegetation and identify corridor opportunities",
            "Select appropriate native plant species for the region",
            "Prepare planting sites and control weeds",
            "Plant native vegetation in strategic locations",
            "Install protective fencing if needed",
            "Monitor establishment and maintain plantings",
          ],
          expectedOutcomes: [
            "Improved wildlife movement between habitats",
            "Enhanced genetic diversity in wildlife populations",
            "Increased ecosystem resilience",
            "Better pollination services for native plants",
          ],
          fundingSources: [
            "Government Environment Restoration Fund",
            "State biodiversity conservation programs",
            "Local Landcare group grants",
          ],
        },
        {
          id: "2",
          title: "Control Invasive Species",
          priority: "High",
          category: "Restoration",
          description:
            "Systematically remove invasive plants and animals that compete with native species and degrade habitat quality.",
          targetSpecies: ["All native species"],
          timeframe: "1-2 years ongoing",
          cost: "$3,000-12,000 per hectare",
          difficulty: "Medium",
          steps: [
            "Conduct invasive species survey and mapping",
            "Prioritize control based on threat level",
            "Apply appropriate control methods",
            "Follow up with repeat treatments",
            "Replant with native species where needed",
            "Establish ongoing monitoring program",
          ],
          expectedOutcomes: [
            "Reduced competition for native species",
            "Improved habitat structure and quality",
            "Increased native plant regeneration",
            "Enhanced ecosystem function",
          ],
          fundingSources: [
            "National Landcare Program",
            "State weed control grants",
            "Local council environmental programs",
          ],
        },
      ];

      // Add water-specific recommendation if no permanent water sources
      if (!assessment.waterSources) {
        fallbackRecommendations.push({
          id: "3",
          title: "Install Wildlife Water Points",
          priority: "Critical",
          category: "Protection",
          description:
            "Establish reliable water sources to support wildlife during dry periods and improve habitat suitability.",
          targetSpecies: ["All wildlife", "Particularly birds and mammals"],
          timeframe: "3-6 months",
          cost: "$2,000-8,000 per water point",
          difficulty: "Easy",
          steps: [
            "Assess water needs and optimal locations",
            "Install tanks or troughs with wildlife-friendly design",
            "Set up reliable water supply system",
            "Create habitat plantings around water points",
            "Install monitoring equipment if needed",
            "Establish maintenance schedule",
          ],
          expectedOutcomes: [
            "Increased wildlife survival during droughts",
            "Greater species diversity on property",
            "Improved breeding success for water-dependent species",
            "Enhanced ecosystem resilience",
          ],
          fundingSources: [
            "Drought resilience funding programs",
            "Wildlife conservation grants",
            "Water infrastructure support schemes",
          ],
        });
      }

      setRecommendations(fallbackRecommendations);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-600";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Restoration":
        return "bg-green-600";
      case "Protection":
        return "bg-blue-600";
      case "Connectivity":
        return "bg-purple-600";
      case "Monitoring":
        return "bg-gray-600";
      case "Community":
        return "bg-pink-600";
      default:
        return "bg-gray-500";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600 dark:text-green-400";
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "Hard":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with background image */}
      <div
        className="relative h-48 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mb-6"
        style={{
          backgroundImage: "url(/images/wildlife-corridor.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900 bg-opacity-30 rounded-lg"></div>
        <div className="relative z-10 text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8" />
            <h2 className="text-3xl font-bold">
              Habitat Protection Recommendations
            </h2>
          </div>
          <p className="text-lg opacity-90">
            AI-powered conservation planning for global ecosystems
          </p>
        </div>
      </div>

      {/* Assessment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="property-size">Property Size (hectares)</Label>
              <Input
                id="property-size"
                type="number"
                value={assessment.propertySize}
                onChange={(e) =>
                  setAssessment((prev) => ({
                    ...prev,
                    propertySize: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={assessment.region}
                onChange={(e) =>
                  setAssessment((prev) => ({
                    ...prev,
                    region: e.target.value,
                  }))
                }
                placeholder=""
              />
            </div>

            <div>
              <Label htmlFor="habitat-type">Primary Habitat Type</Label>
              <Select
                value={assessment.habitatType}
                onValueChange={(value) =>
                  setAssessment((prev) => ({ ...prev, habitatType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select habitat type" />
                </SelectTrigger>
                <SelectContent>
                  {habitatTypes.map((habitat) => (
                    <SelectItem key={habitat.value} value={habitat.value}>
                      {habitat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="connectivity">Habitat Connectivity</Label>
              <Select
                value={assessment.connectivity}
                onValueChange={(value) =>
                  setAssessment((prev) => ({ ...prev, connectivity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connectivity level" />
                </SelectTrigger>
                <SelectContent>
                  {connectivityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="current-management">Current Management</Label>
              <Input
                id="current-management"
                value={assessment.currentManagement}
                onChange={(e) =>
                  setAssessment((prev) => ({
                    ...prev,
                    currentManagement: e.target.value,
                  }))
                }
                placeholder="e.g., Cattle grazing, Conservation"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="threatened-species"
                  checked={assessment.threatenedSpecies}
                  onChange={(e) =>
                    setAssessment((prev) => ({
                      ...prev,
                      threatenedSpecies: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="threatened-species">
                  Threatened Species Present
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="water-sources"
                  checked={assessment.waterSources}
                  onChange={(e) =>
                    setAssessment((prev) => ({
                      ...prev,
                      waterSources: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="water-sources">Permanent Water Sources</Label>
              </div>
            </div>
          </div>

          <Button
            onClick={generateRecommendations}
            disabled={loading || !assessment.region || !assessment.habitatType}
            className="mt-4"
          >
            {loading ? "Analyzing Habitat..." : "Generate Protection Plan"}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Habitat Protection Action Plan
          </h3>

          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <Card key={rec.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {rec.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={`${getPriorityColor(
                          rec.priority
                        )} text-white`}
                      >
                        {rec.priority}
                      </Badge>
                      <Badge
                        className={`${getCategoryColor(
                          rec.category
                        )} text-white`}
                      >
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Timeframe:</span>
                      <br />
                      {rec.timeframe}
                    </div>
                    <div>
                      <span className="font-semibold">Estimated Cost:</span>
                      <br />
                      {rec.cost}
                    </div>
                    <div>
                      <span className="font-semibold">Difficulty:</span>
                      <br />
                      <span className={getDifficultyColor(rec.difficulty)}>
                        {rec.difficulty}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-500" />
                      Target Species
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {rec.targetSpecies.map((species) => (
                        <Badge
                          key={species}
                          variant="secondary"
                          className="text-xs"
                        >
                          {species}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Implementation Steps
                    </h4>
                    <ul className="space-y-1">
                      {rec.steps.map((step, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TreePine className="h-4 w-4 text-green-500" />
                      Expected Outcomes
                    </h4>
                    <ul className="space-y-1">
                      {rec.expectedOutcomes.map((outcome, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                      Potential Funding Sources
                    </h4>
                    <ul className="space-y-1">
                      {rec.fundingSources.map((source, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Resource Section */}
      <DynamicResourceSection
        featureName="habitat-protection"
        fallbackContent={
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300">
                Global Habitat Conservation Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Government Programs</h4>
                  <ul className="space-y-1">
                    <li>• Environment Restoration Fund</li>
                    <li>• Biodiversity Conservation Trust</li>
                    <li>• National Landcare Program</li>
                    <li>• Threatened Species Action Plans</li>
                    <li>• Regional Land Partnerships</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    Conservation Organizations
                  </h4>
                  <ul className="space-y-1">
                    <li>• Wildlife Conservancy</li>
                    <li>• Bush Heritage</li>
                    <li>• Greening Organizations</li>
                    <li>• Local Landcare networks</li>
                    <li>• Native vegetation trusts</li>
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
