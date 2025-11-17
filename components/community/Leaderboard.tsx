'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface LeaderboardEntry {
  rank: number;
  name: string;
  co2Saved: number;
  badge: string;
  highlight?: boolean;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const url = user
        ? `/api/community/leaderboard?userId=${user.id}&limit=5`
        : '/api/community/leaderboard?limit=5';

      const response = await fetch(url);
      const data = await response.json();

      setLeaderboard(data.leaderboard || []);
      setCurrentUser(data.currentUser);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Contributors
          </CardTitle>
          <CardDescription>This month's climate champions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allEntries = [...leaderboard];
  if (currentUser && !leaderboard.find((e) => e.name === 'You')) {
    allEntries.push({ ...currentUser, highlight: true });
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Top Contributors
        </CardTitle>
        <CardDescription>This month's climate champions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {allEntries.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No data yet. Join challenges to appear here!</p>
        ) : (
          allEntries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.highlight
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{entry.badge}</span>
                <div>
                  <p className="font-semibold">{entry.name}</p>
                  <p className="text-xs text-gray-500">Rank #{entry.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{entry.co2Saved} kg</p>
                <p className="text-xs text-gray-500">CO₂ saved</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
