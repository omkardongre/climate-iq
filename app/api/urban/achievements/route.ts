import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Define all possible achievements
    const allAchievements: Achievement[] = [
      // Water Saver Achievements
      {
        type: 'water_saver',
        name: 'Water Warrior',
        description: 'Track water usage for 7 consecutive days',
        icon: '💧',
        milestone: 7,
        earned: false,
      },
      {
        type: 'water_saver',
        name: 'Hydro Hero',
        description: 'Track water usage for 30 consecutive days',
        icon: '🌊',
        milestone: 30,
        earned: false,
      },
      {
        type: 'water_efficient',
        name: 'Water Efficient',
        description: 'Use 20% less water than national average for 7 days',
        icon: '💦',
        milestone: 7,
        earned: false,
      },
      // Recycling Achievements
      {
        type: 'recycling_hero',
        name: 'Recycling Rookie',
        description: 'Scan 5 waste items',
        icon: '♻️',
        milestone: 5,
        earned: false,
      },
      {
        type: 'recycling_hero',
        name: 'Recycling Champion',
        description: 'Scan 25 waste items',
        icon: '🏆',
        milestone: 25,
        earned: false,
      },
      {
        type: 'recycling_hero',
        name: 'Waste Wizard',
        description: 'Scan 100 waste items',
        icon: '🧙',
        milestone: 100,
        earned: false,
      },
      // Energy Achievements
      {
        type: 'energy_star',
        name: 'Energy Tracker',
        description: 'Track electricity usage for 7 consecutive days',
        icon: '⚡',
        milestone: 7,
        earned: false,
      },
      {
        type: 'energy_star',
        name: 'Power Saver',
        description: 'Track electricity usage for 30 consecutive days',
        icon: '🔋',
        milestone: 30,
        earned: false,
      },
      {
        type: 'energy_efficient',
        name: 'Energy Efficient',
        description: 'Use 20% less electricity than national average for 7 days',
        icon: '💡',
        milestone: 7,
        earned: false,
      },
      // Eco-Advisor Achievements
      {
        type: 'eco_learner',
        name: 'Eco Student',
        description: 'Get eco-tips for 7 consecutive days',
        icon: '📚',
        milestone: 7,
        earned: false,
      },
      {
        type: 'eco_learner',
        name: 'Eco Master',
        description: 'Get eco-tips for 30 consecutive days',
        icon: '🎓',
        milestone: 30,
        earned: false,
      },
      // Carbon Reduction
      {
        type: 'carbon_reducer',
        name: 'Carbon Conscious',
        description: 'Save 10 kg CO2e through recycling',
        icon: '🌱',
        milestone: 10,
        earned: false,
      },
      {
        type: 'carbon_reducer',
        name: 'Climate Champion',
        description: 'Save 50 kg CO2e through recycling',
        icon: '🌍',
        milestone: 50,
        earned: false,
      },
    ];

    // If no userId or invalid UUID, return all achievements as not earned
    if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Calculate progress from demo data
      const achievements = await calculateAchievementsProgress(null, allAchievements);
      return NextResponse.json({ achievements });
    }

    // Get user's earned achievements
    const { data: earnedAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (achievementsError) {
      console.error('Achievements fetch error:', achievementsError);
    }

    // Calculate progress and mark earned achievements
    const achievements = await calculateAchievementsProgress(userId, allAchievements, earnedAchievements || []);

    return NextResponse.json({ achievements });

  } catch (error: any) {
    console.error('Achievements error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

async function calculateAchievementsProgress(
  userId: string | null,
  allAchievements: Achievement[],
  earnedAchievements: any[] = []
): Promise<Achievement[]> {
  
  const achievements = [...allAchievements];

  // Mark earned achievements
  for (const earned of earnedAchievements) {
    const achievement = achievements.find(
      a => a.type === earned.achievement_type && a.milestone === earned.milestone_value
    );
    if (achievement) {
      achievement.earned = true;
      achievement.earnedDate = earned.earned_date;
    }
  }

  // Calculate progress for unearned achievements
  try {
    // Get water usage streak
    const waterStreak = await getStreak('water_usage', userId);
    const waterScans = await getCount('water_usage', userId);
    const waterEfficiencyDays = await getEfficiencyDays('water_usage', userId, 135, 0.8);

    // Get electricity usage streak
    const electricityStreak = await getStreak('electricity_usage', userId);
    const electricityScans = await getCount('electricity_usage', userId);
    const electricityEfficiencyDays = await getEfficiencyDays('electricity_usage', userId, 3, 0.8);

    // Get waste scans count
    const wasteScans = await getCount('waste_scans', userId);
    const totalCarbonSaved = await getTotalCarbonSaved(userId);

    // Get eco-tips streak
    const ecoTipsStreak = await getStreak('eco_advisor_tips', userId);

    // Update progress for each achievement
    for (const achievement of achievements) {
      if (achievement.earned) continue;

      switch (achievement.type) {
        case 'water_saver':
          achievement.progress = waterStreak;
          achievement.progressMax = achievement.milestone;
          break;
        case 'water_efficient':
          achievement.progress = waterEfficiencyDays;
          achievement.progressMax = achievement.milestone;
          break;
        case 'recycling_hero':
          achievement.progress = wasteScans;
          achievement.progressMax = achievement.milestone;
          break;
        case 'energy_star':
          achievement.progress = electricityStreak;
          achievement.progressMax = achievement.milestone;
          break;
        case 'energy_efficient':
          achievement.progress = electricityEfficiencyDays;
          achievement.progressMax = achievement.milestone;
          break;
        case 'eco_learner':
          achievement.progress = ecoTipsStreak;
          achievement.progressMax = achievement.milestone;
          break;
        case 'carbon_reducer':
          achievement.progress = Math.floor(totalCarbonSaved);
          achievement.progressMax = achievement.milestone;
          break;
      }

      // Auto-award achievement if progress >= milestone
      if (achievement.progress && achievement.progress >= achievement.milestone && userId) {
        await awardAchievement(userId, achievement);
        achievement.earned = true;
        achievement.earnedDate = new Date().toISOString();
      }
    }

  } catch (error) {
    console.error('Progress calculation error:', error);
  }

  return achievements;
}

async function getStreak(table: string, userId: string | null): Promise<number> {
  if (!userId) return 0;

  try {
    // Determine the correct date field for this table
    const dateField = table === 'eco_advisor_tips' ? 'tip_date' : (table === 'waste_scans' ? 'scan_date' : 'usage_date');
    
    const { data, error } = await supabase
      .from(table)
      .select(dateField)
      .eq('user_id', userId)
      .order(dateField, { ascending: false })
      .limit(100);

    if (error) {
      console.error(`[${table}] Query error:`, error);
      return 0;
    }

    if (!data || data.length === 0) {
      console.log(`[${table}] No data found for streak calculation`);
      return 0;
    }
    
    // Get unique dates only (in case of multiple entries per day)
    const uniqueDates = [...new Set(data.map(d => (d as any)[dateField]))].sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    console.log(`[${table}] Unique dates found: ${uniqueDates.length}`, uniqueDates.slice(0, 5));

    if (uniqueDates.length === 0) return 0;

    // Start with streak of 1 (we have at least one entry)
    let streak = 1;
    
    // Compare consecutive dates
    for (let i = 1; i < uniqueDates.length; i++) {
      const date1 = new Date(uniqueDates[i - 1]);
      const date2 = new Date(uniqueDates[i]);
      
      // Calculate difference in days
      const diffTime = date1.getTime() - date2.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`[${table}] Comparing ${uniqueDates[i-1]} and ${uniqueDates[i]}: ${diffDays} days apart`);
      
      if (diffDays === 1) {
        // Consecutive day
        streak++;
      } else if (diffDays > 1) {
        // Gap found, stop counting
        break;
      }
      // If diffDays === 0, it's the same day (shouldn't happen with unique dates)
    }

    console.log(`[${table}] Final streak: ${streak}`);
    return streak;
  } catch (err) {
    console.error(`[${table}] Streak calculation error:`, err);
    return 0;
  }
}

async function getCount(table: string, userId: string | null): Promise<number> {
  if (!userId) return 0;

  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return count || 0;
  } catch {
    return 0;
  }
}

async function getEfficiencyDays(table: string, userId: string | null, nationalAvg: number, threshold: number): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('usage_date', { ascending: false })
      .limit(30);

    if (error || !data) return 0;

    const field = table === 'water_usage' ? 'liters_used' : 'kwh_used';
    const efficientDays = data.filter(d => d[field] <= nationalAvg * threshold).length;

    return efficientDays;
  } catch {
    return 0;
  }
}

async function getTotalCarbonSaved(userId: string | null): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from('waste_scans')
      .select('carbon_impact')
      .eq('user_id', userId);

    if (error || !data) return 0;

    return data.reduce((sum, scan) => sum + (scan.carbon_impact || 0), 0);
  } catch {
    return 0;
  }
}

async function awardAchievement(userId: string, achievement: Achievement): Promise<void> {
  try {
    await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievement.type,
        achievement_name: achievement.name,
        achievement_description: achievement.description,
        badge_icon: achievement.icon,
        milestone_value: achievement.milestone,
      });
  } catch (error) {
    console.error('Award achievement error:', error);
  }
}
