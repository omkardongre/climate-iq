import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch active challenges
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching challenges:', error);
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }

    // Get participant counts for each challenge
    const challengesWithCounts = await Promise.all(
      (challenges || []).map(async (challenge) => {
        const { count } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        const daysLeft = Math.ceil(
          (new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...challenge,
          participants: count || 0,
          daysLeft,
        };
      })
    );

    return NextResponse.json({ challenges: challengesWithCounts });
  } catch (error: any) {
    console.error('Challenges API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
