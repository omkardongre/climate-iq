import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { challengeId, userId } = await request.json();

    if (!challengeId || !userId) {
      return NextResponse.json(
        { error: 'Missing challengeId or userId' },
        { status: 400 }
      );
    }

    // Check if user already joined
    const { data: existing } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already joined this challenge' },
        { status: 400 }
      );
    }

    // Join challenge
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        progress: 0,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining challenge:', error);
      return NextResponse.json(
        { error: 'Failed to join challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, participation: data });
  } catch (error: any) {
    console.error('Join challenge API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join challenge' },
      { status: 500 }
    );
  }
}
