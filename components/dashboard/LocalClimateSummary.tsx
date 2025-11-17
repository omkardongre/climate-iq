import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";

export function LocalClimateSummary() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Cloud className="h-5 w-5" />
          Local Climate Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Temperature</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">--°C</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">AQI</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">--</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Humidity</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">--%</span>
          </div>
          
          <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Live weather data will appear here
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
