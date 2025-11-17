import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Refresh materialized view
    await supabase.rpc('refresh_leaderboard');

    // Get top users from leaderboard
    const { data: topUsers, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Get current user's rank if userId provided
    let currentUserRank = null;
    if (userId) {
      const { data: userRank } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .single();

      currentUserRank = userRank;
    }

    // Format leaderboard data
    const leaderboard = (topUsers || []).map((user, index) => ({
      rank: user.rank || index + 1,
      name: user.email?.split('@')[0] || 'Anonymous',
      co2Saved: user.total_co2_saved || 0,
      challengesCompleted: user.challenges_completed || 0,
      badgesEarned: user.badges_earned || 0,
      badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅',
    }));

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserRank ? {
        rank: currentUserRank.rank,
        name: 'You',
        co2Saved: currentUserRank.total_co2_saved || 0,
        challengesCompleted: currentUserRank.challenges_completed || 0,
        badgesEarned: currentUserRank.badges_earned || 0,
        badge: '⭐',
      } : null,
    });
  } catch (error: any) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
