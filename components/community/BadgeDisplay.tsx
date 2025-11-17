'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface Badge {
  type: string;
  name: string;
  icon: string;
  locked: boolean;
  earnedAt?: string;
}

export function BadgeDisplay() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBadges();
    } else {
      // Show only earnable badges (3 total: 2 modules + 1 master)
      setBadges([
        { type: 'climate_basics', name: 'Climate Expert', icon: '🌍', locked: true },
        { type: 'sustainability', name: 'Eco Warrior', icon: '♻️', locked: true },
        { type: 'master', name: 'Climate Master', icon: '🏆', locked: true },
      ]);
      setLoading(false);
    }
  }, [user]);

  const fetchBadges = async () => {
    try {
      const response = await fetch(`/api/community/badges?userId=${user?.id}`);
      const data = await response.json();
      setBadges(data.badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Your Badges
          </CardTitle>
          <CardDescription>Complete modules to earn badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center p-4 rounded-lg bg-gray-200 animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full mb-2"></div>
                <div className="w-16 h-3 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedCount = badges.filter((b) => !b.locked).length;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-600" />
          Your Badges
        </CardTitle>
        <CardDescription>
          {user
            ? `${earnedCount} of ${badges.length} badges earned`
            : 'Sign in to earn badges'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.type}
              className={`flex flex-col items-center p-4 rounded-lg transition-all ${
                badge.locked
                  ? 'bg-gray-200 dark:bg-gray-700 opacity-50 grayscale'
                  : 'bg-white dark:bg-gray-800 shadow-lg ring-2 ring-purple-400 animate-pulse'
              }`}
              title={badge.earnedAt ? `Earned on ${new Date(badge.earnedAt).toLocaleDateString()}` : 'Locked - Complete quiz to unlock'}
            >
              <span className="text-4xl mb-2">{badge.icon}</span>
              <span className="text-sm font-medium text-center">{badge.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
