"use client";

import { useState, useEffect } from "react";
import { storyblokService } from "@/lib/storyblok-service";
import ResourceSection from "@/components/storyblok/ResourceSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicResourceSectionProps {
  featureName: string;
  fallbackContent?: React.ReactNode;
}

export default function DynamicResourceSection({
  featureName,
  fallbackContent,
}: DynamicResourceSectionProps) {
  const [resourceData, setResourceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("global");

  useEffect(() => {
    // Load saved location from localStorage (using same key as location selector)
    const savedLocation = localStorage.getItem("climateIQ-location");
    console.log("Initial location from localStorage:", savedLocation);
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        setSelectedCountry(locationData.code);
      } catch (error) {
        console.error("Failed to parse saved location:", error);
        setLoading(false);
      }
    } else {
      setLoading(false); // No location selected, show fallback immediately
    }

    // Listen for location changes
    const handleLocationChange = (event: CustomEvent) => {
      console.log("Location changed event received:", event.detail);
      setSelectedCountry(event.detail.code);
    };

    window.addEventListener(
      "locationChanged",
      handleLocationChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "locationChanged",
        handleLocationChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const fetchResourceData = async () => {
      // Only fetch from Storyblok for USA and India
      if (selectedCountry !== "usa" && selectedCountry !== "india") {
        console.log(
          `Country ${selectedCountry} not supported for CMS, using fallback content`
        );
        setResourceData(null);
        setLoading(false);
        return;
      }

      console.log(
        `Fetching Storyblok data for ${selectedCountry}/${featureName}`
      );
      setLoading(true);
      setError(null);

      try {
        const data = await storyblokService.getResourceSection(
          selectedCountry,
          featureName
        );
        console.log("Storyblok data received:", data);
        setResourceData(data);
      } catch (err) {
        console.error(
          `Failed to fetch resource section for ${featureName}:`,
          err
        );
        setError(
          err instanceof Error ? err.message : "Failed to fetch resource data"
        );
        setResourceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResourceData();
  }, [featureName, selectedCountry]);

  if (loading) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.warn(`Resource section error for ${featureName}:`, error);
  }

  // If we have Storyblok data (USA/India), use it
  if (
    resourceData &&
    (selectedCountry === "usa" || selectedCountry === "india")
  ) {
    return <ResourceSection blok={resourceData} />;
  }

  // Otherwise, show fallback content (existing static content for other countries)
  return fallbackContent || null;
}
