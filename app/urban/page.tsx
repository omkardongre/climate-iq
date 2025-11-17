"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Lightbulb,
  Camera,
  Droplets,
  Sun,
} from "lucide-react";
import { EcoAdvisor } from "@/components/urban/EcoAdvisor";
import { WasteScanner } from "@/components/urban/WasteScanner";
import { SmartHomeTracker } from "@/components/urban/SmartHomeTracker";
import { SolarSavingsCalculator } from "@/components/urban/SolarSavingsCalculator";

export default function UrbanPage() {
  const [activeTab, setActiveTab] = useState("eco-advisor");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Building2 className="h-10 w-10 text-blue-600" />
          Urban Sustainability Hub
        </h1>
        <p className="text-muted-foreground text-lg">
          AI-powered tools for sustainable urban living
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="eco-advisor" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Eco-Advisor</span>
          </TabsTrigger>
          <TabsTrigger
            value="waste-scanner"
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Waste Scanner</span>
          </TabsTrigger>
          <TabsTrigger value="smart-home" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">Smart Home</span>
          </TabsTrigger>
          <TabsTrigger value="solar" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Solar</span>
          </TabsTrigger>

        </TabsList>

        {/* Eco-Advisor Tab */}
        <TabsContent value="eco-advisor" className="space-y-6">
          <EcoAdvisor />
        </TabsContent>

        {/* Waste Scanner Tab */}
        <TabsContent value="waste-scanner" className="space-y-6">
          <WasteScanner />
        </TabsContent>

        {/* Smart Home Tab */}
        <TabsContent value="smart-home" className="space-y-6">
          <SmartHomeTracker />
        </TabsContent>

        {/* Solar Tab */}
        <TabsContent value="solar" className="space-y-6">
          <SolarSavingsCalculator />
        </TabsContent>


      </Tabs>
    </div>
  );
}
