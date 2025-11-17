import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Flame, Wind } from "lucide-react";

export function AlertsPanel() {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
          <AlertTriangle className="h-5 w-5" />
          Alerts Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border-l-4 border-red-500">
            <div className="flex items-start gap-2">
              <Flame className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Fire Alert</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No active alerts</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-start gap-2">
              <Wind className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Air Quality</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No active alerts</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Weather</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No active alerts</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
