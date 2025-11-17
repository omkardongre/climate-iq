'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  participants: number;
  daysLeft: number;
  co2_impact: number;
}

export function ChallengeList() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/community/challenges');
      const data = await response.json();
      
      if (data.challenges && data.challenges.length > 0) {
        setChallenges(data.challenges);
      } else {
        // Fallback: Use default challenges if DB not set up yet
        setChallenges([
          {
            id: 'car-free-week',
            title: 'Car-Free Week',
            description: 'Use public transport, bike, or walk for 7 days',
            icon: '🚗',
            participants: 234,
            daysLeft: 5,
            co2_impact: 50,
          },
          {
            id: 'zero-waste',
            title: 'Zero Waste Challenge',
            description: 'Reduce waste to zero for one week',
            icon: '♻️',
            participants: 156,
            daysLeft: 12,
            co2_impact: 30,
          },
          {
            id: 'solar-month',
            title: 'Solar Energy Month',
            description: 'Install or promote solar energy in your community',
            icon: '☀️',
            participants: 89,
            daysLeft: 20,
            co2_impact: 200,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      // Use fallback challenges on error
      setChallenges([
        {
          id: 'car-free-week',
          title: 'Car-Free Week',
          description: 'Use public transport, bike, or walk for 7 days',
          icon: '🚗',
          participants: 234,
          daysLeft: 5,
          co2_impact: 50,
        },
        {
          id: 'zero-waste',
          title: 'Zero Waste Challenge',
          description: 'Reduce waste to zero for one week',
          icon: '♻️',
          participants: 156,
          daysLeft: 12,
          co2_impact: 30,
        },
        {
          id: 'solar-month',
          title: 'Solar Energy Month',
          description: 'Install or promote solar energy in your community',
          icon: '☀️',
          participants: 89,
          daysLeft: 20,
          co2_impact: 200,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) {
      alert('Please sign in to join challenges');
      return;
    }

    try {
      const response = await fetch('/api/community/join-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Successfully joined challenge!');
        fetchChallenges(); // Refresh to update participant count
      } else {
        alert(data.error || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Failed to join challenge');
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Active Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No active challenges at the moment</p>
        ) : (
          challenges.map((challenge) => (
            <div key={challenge.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  {challenge.icon} {challenge.title}
                </h3>
                <Badge className="bg-green-500">{challenge.participants} joined</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{challenge.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span>Ends in {challenge.daysLeft} days</span>
                  <span className="ml-3">💚 {challenge.co2_impact} kg CO₂ impact</span>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleJoinChallenge(challenge.id)}
                >
                  Join Challenge
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
