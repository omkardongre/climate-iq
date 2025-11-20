"use client";

import { ClimateMap } from '@/components/ClimateMap';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ClimateMapPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold">Interactive Climate Map</h1>
          <p className="text-muted-foreground mt-2">
            Real-time environmental monitoring with satellite data
          </p>
        </div>
      </div>

      {/* Map Component */}
      <ClimateMap />

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🛰️ Real-Time Data</h3>
          <p className="text-sm text-muted-foreground">
            Fire data updated every 15 minutes from NASA's MODIS and VIIRS satellites
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🔥 Fire Detection</h3>
          <p className="text-sm text-muted-foreground">
            Active fires detected with confidence levels and fire radiative power measurements
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">📊 Risk Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Automated risk assessment based on fire intensity, count, and confidence levels
          </p>
        </div>
      </div>
    </div>
  );
}
