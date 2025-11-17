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

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user's earned badges
    const { data: earnedBadges, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching badges:', error);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    // Only earnable badges (2 modules + 1 master badge)
    const allBadges = [
      { type: 'climate_basics', name: 'Climate Expert', icon: '🌍', locked: true },
      { type: 'sustainability', name: 'Eco Warrior', icon: '♻️', locked: true },
      { type: 'master', name: 'Climate Master', icon: '🏆', locked: true },
    ];

    // Mark earned badges as unlocked
    const earnedTypes = new Set((earnedBadges || []).map((b) => b.badge_type));
    const badges = allBadges.map((badge) => ({
      ...badge,
      locked: !earnedTypes.has(badge.type),
      earnedAt: earnedBadges?.find((b) => b.badge_type === badge.type)?.earned_at,
    }));

    return NextResponse.json({ badges });
  } catch (error: any) {
    console.error('Badges API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
