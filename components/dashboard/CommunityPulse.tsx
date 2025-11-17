import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Trophy } from "lucide-react";
import Link from "next/link";

export function CommunityPulse() {
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <Users className="h-5 w-5" />
          Community Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Upcoming Events</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No events scheduled</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Active Challenges</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No challenges available</p>
              </div>
            </div>
          </div>
          
          <Link 
            href="/community"
            className="block w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Community
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
