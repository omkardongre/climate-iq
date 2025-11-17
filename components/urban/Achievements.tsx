"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Lock, CheckCircle, TrendingUp } from 'lucide-react';

interface Achievement {
  type: string;
  name: string;
  description: string;
  icon: string;
  milestone: number;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  progressMax?: number;
}

export function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      console.log('Achievements - Logged in user:', user.id);
      fetchAchievements(user.id);
    } else {
      console.log('Achievements - No user logged in');
      fetchAchievements(null);
    }
  }, [user]);

  const fetchAchievements = async (uid: string | null) => {
    setLoading(true);
    try {
      const url = uid 
        ? `/api/urban/achievements?userId=${uid}` 
        : '/api/urban/achievements';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setAchievements(data.achievements || []);
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementsByCategory = (category: string) => {
    if (category === 'all') return achievements;
    if (category === 'earned') return achievements.filter(a => a.earned);
    return achievements.filter(a => a.type.includes(category));
  };

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;
  const progressPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'earned', name: 'Earned', icon: '✅' },
    { id: 'water', name: 'Water', icon: '💧' },
    { id: 'energy', name: 'Energy', icon: '⚡' },
    { id: 'recycling', name: 'Recycling', icon: '♻️' },
    { id: 'carbon', name: 'Carbon', icon: '🌱' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Achievements & Progress
              </CardTitle>
              <CardDescription>
                Track your sustainability milestones and earn badges
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-yellow-600">{earnedCount}/{totalCount}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              <span className="mr-1">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                  <p className="text-muted-foreground">Loading achievements...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getAchievementsByCategory(cat.id).map((achievement, index) => (
                  <AchievementCard key={index} achievement={achievement} />
                ))}
              </div>
            )}

            {!loading && getAchievementsByCategory(cat.id).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">No achievements in this category yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const progressPercentage = achievement.progressMax
    ? Math.min(((achievement.progress || 0) / achievement.progressMax) * 100, 100)
    : 0;

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
      achievement.earned ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' : 'opacity-75'
    }`}>
      {/* Earned Badge */}
      {achievement.earned && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-6 w-6 text-green-600 fill-green-100" />
        </div>
      )}

      {/* Locked Overlay */}
      {!achievement.earned && progressPercentage === 0 && (
        <div className="absolute top-2 right-2">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={`text-4xl ${!achievement.earned && 'grayscale opacity-50'}`}>
            {achievement.icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{achievement.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {achievement.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        {!achievement.earned && achievement.progressMax && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {achievement.progress || 0} / {achievement.progressMax}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Earned Date */}
        {achievement.earned && achievement.earnedDate && (
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-500 text-white">
              Earned {new Date(achievement.earnedDate).toLocaleDateString()}
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        {!achievement.earned && (
          <Badge variant="outline" className={
            progressPercentage > 50 
              ? 'border-yellow-400 text-yellow-600' 
              : 'border-gray-300 text-gray-600'
          }>
            {progressPercentage > 50 ? 'Almost there!' : 'In Progress'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
