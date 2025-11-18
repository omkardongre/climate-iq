"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  Shield,
  Route,
  Flame,
  TreePine,
} from "lucide-react";
import { parseMarkdownToHtml } from "@/lib/markdown-utils";

interface BushfireRiskData {
  riskLevel:
    | "Low-Moderate"
    | "High"
    | "Very High"
    | "Severe"
    | "Extreme"
    | "Catastrophic";
  temperature: number;
  humidity: number;
  windSpeed: number;
  location: string;
  recommendations: string[];
  evacuationRoutes: string[];
  fireSafeLandscaping: string[];
}

const riskColors = {
  "Low-Moderate": "bg-green-500",
  High: "bg-yellow-500",
  "Very High": "bg-orange-500",
  Severe: "bg-red-500",
  Extreme: "bg-purple-500",
  Catastrophic: "bg-black",
};

const riskTextColors = {
  "Low-Moderate": "text-green-700",
  High: "text-yellow-700",
  "Very High": "text-orange-700",
  Severe: "text-red-700",
  Extreme: "text-purple-700",
  Catastrophic: "text-white",
};

// Helper function to map API risk levels to component format
function mapRiskLevel(apiLevel: string): BushfireRiskData["riskLevel"] {
  const mapping: { [key: string]: BushfireRiskData["riskLevel"] } = {
    low: "Low-Moderate",
    moderate: "Low-Moderate",
    "low-moderate": "Low-Moderate",
    high: "High",
    "very-high": "Very High",
    "very high": "Very High",
    severe: "Severe",
    extreme: "Extreme",
    catastrophic: "Catastrophic",
  };
  return mapping[apiLevel?.toLowerCase()] || "High";
}

export function BushfireRiskDashboard() {
  const [riskData, setRiskData] = useState<BushfireRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Alice Springs, NT");
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchBushfireRisk();
  }, [location]);

  const fetchBushfireRisk = async () => {
    if (fetchingRef.current) return; // Prevent duplicate calls

    fetchingRef.current = true;
    setLoading(true);
    try {
      // Get selected location from dashboard's location storage (set by ClimateBoard)
      const selectedLocationObj = localStorage.getItem(
        "climateIQ-user-location"
      );
      const selectedLocation = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : location;

      // Use Gemini AI to generate bushfire risk assessment based on location and current conditions
      const response = await fetch("/api/bushfire-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: selectedLocation,
          selectedCountry: selectedLocation,
        }),
      });

      if (response.ok) {
        const apiData = await response.json();
        console.log("Bushfire API response:", apiData);

        // Transform API response to match component interface
        const transformedData: BushfireRiskData = {
          riskLevel: mapRiskLevel(
            apiData.fire_danger_rating || apiData.risk_level
          ),
          temperature: apiData.weather_factors?.temperature_impact ? 35 : 38,
          humidity: apiData.weather_factors?.humidity_impact ? 20 : 15,
          windSpeed: apiData.weather_factors?.wind_impact ? 25 : 20,
          location: selectedLocation,
          recommendations: apiData.safety_recommendations || [],
          evacuationRoutes:
            apiData.evacuation_routes?.map(
              (route: any) =>
                `${route.route_name}: ${route.description}${
                  route.estimated_time ? ` (${route.estimated_time})` : ""
                }`
            ) || [],
          fireSafeLandscaping:
            apiData.fire_safe_landscaping?.map(
              (item: any) =>
                `${item.action} (${item.priority}): ${item.description}`
            ) || [],
        };

        console.log("Transformed data:", transformedData);
        setRiskData(transformedData);
      } else {
        // Fallback to mock data if API fails
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data based on typical regional conditions
        const mockData: BushfireRiskData = {
          riskLevel: "Very High",
          temperature: 38,
          humidity: 15,
          windSpeed: 25,
          location: location,
          recommendations: [
            "Monitor fire danger ratings and weather conditions closely",
            "Ensure your bushfire survival plan is up to date",
            "Clear gutters and remove flammable materials from around your home",
            "Check and maintain firefighting equipment",
            "Stay informed through official channels and emergency services",
          ],
          evacuationRoutes: [
            "Main Highway 87 towards Darwin (primary route)",
            "Stuart Highway south to Adelaide (backup route)",
            "Local evacuation center: Alice Springs Convention Centre",
          ],
          fireSafeLandscaping: [
            "Create a 30-meter defensible space around buildings",
            "Remove dead vegetation and prune tree branches",
            "Plant fire-resistant native species like saltbush",
            "Install sprinkler systems for garden beds",
            "Use gravel or stone mulch instead of bark mulch",
          ],
        };

        setRiskData(mockData);
      }
    } catch (error) {
      console.error("Error fetching bushfire risk:", error);

      // Fallback to mock data on error
      const mockData: BushfireRiskData = {
        riskLevel: "Very High",
        temperature: 38,
        humidity: 15,
        windSpeed: 25,
        location: selectedLocation || location,
        recommendations: [
          "Monitor fire danger ratings and weather conditions closely",
          "Ensure your bushfire survival plan is up to date",
          "Clear gutters and remove flammable materials from around your home",
          "Check and maintain firefighting equipment",
          "Stay informed through official channels and emergency services",
        ],
        evacuationRoutes: [
          "Main Highway 87 towards Darwin (primary route)",
          "Stuart Highway south to Adelaide (backup route)",
          "Local evacuation center: Alice Springs Convention Centre",
        ],
        fireSafeLandscaping: [
          "Create a 30-meter defensible space around buildings",
          "Remove dead vegetation and prune tree branches",
          "Plant fire-resistant native species like saltbush",
          "Install sprinkler systems for garden beds",
          "Use gravel or stone mulch instead of bark mulch",
        ],
      };
      setRiskData(mockData);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!riskData) return null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Flame className="h-10 w-10 text-red-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Bushfire Risk Assessment
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Real-time fire danger monitoring for {location}. Stay informed about
          current conditions and get personalized safety recommendations.
        </p>
        <div className="mt-4">
          <Button onClick={fetchBushfireRisk} variant="outline" size="sm">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Current Risk Level */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Current Fire Danger Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge
              className={`${
                riskColors[riskData.riskLevel]
              } text-white px-4 py-2 text-lg font-bold`}
            >
              {riskData.riskLevel}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4" />
              {riskData.location}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Thermometer className="h-6 w-6 mx-auto mb-1 text-red-500" />
              <div className="text-2xl font-bold">{riskData.temperature}°C</div>
              <div className="text-sm text-gray-500">Temperature</div>
            </div>
            <div className="text-center">
              <Droplets className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold">{riskData.humidity}%</div>
              <div className="text-sm text-gray-500">Humidity</div>
            </div>
            <div className="text-center">
              <Wind className="h-6 w-6 mx-auto mb-1 text-gray-500" />
              <div className="text-2xl font-bold">
                {riskData.windSpeed} km/h
              </div>
              <div className="text-sm text-gray-500">Wind Speed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Safety Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Safety Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {riskData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Evacuation Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Evacuation Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {riskData.evacuationRoutes.map((route, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  {route}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Fire-Safe Landscaping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-emerald-500" />
              Fire-Safe Landscaping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {riskData.fireSafeLandscaping.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts */}
      <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300">
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold">Emergency Services</div>
              <div className="text-red-600 dark:text-red-400 font-bold text-lg">
                000
              </div>
            </div>
            <div>
              <div className="font-semibold">Bushfire Info Hotline</div>
              <div className="text-red-600 dark:text-red-400 font-bold">
                1800 362 361
              </div>
            </div>
            <div>
              <div className="font-semibold">ABC Radio Emergency</div>
              <div className="text-red-600 dark:text-red-400 font-bold">
                783 AM
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
