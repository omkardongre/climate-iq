import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin } from "lucide-react";
import Link from "next/link";

export function EarthMonitor() {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
          <Globe className="h-5 w-5" />
          Earth Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Interactive map will load here
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">🔥 Active Fires:</span>
            <span className="font-semibold text-gray-900 dark:text-white">--</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">🌫️ AQI Alerts:</span>
            <span className="font-semibold text-gray-900 dark:text-white">--</span>
          </div>
          
          <Link 
            href="/climate-map"
            className="block w-full text-center py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Full Map
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
