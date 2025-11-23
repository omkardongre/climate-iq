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


    </div>
  );
}
