import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";

export function DailyAIInsight() {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-indigo-900 dark:text-indigo-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Daily AI Insight
          </div>
          <button className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your personalized climate tip will appear here based on your location, weather, and activities.
              </p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Powered by Gemini AI
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
