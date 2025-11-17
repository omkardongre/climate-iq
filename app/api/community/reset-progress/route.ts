import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, moduleId } = await request.json();

    if (!userId || !moduleId) {
      return NextResponse.json(
        { error: 'Missing userId or moduleId' },
        { status: 400 }
      );
    }

    // Get module info to determine badge type
    const { data: module } = await supabase
      .from('learning_modules')
      .select('category')
      .eq('id', moduleId)
      .single();

    // Delete lesson progress
    await supabase
      .from('user_lesson_progress')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    // Delete quiz attempts
    await supabase
      .from('user_quiz_attempts')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    // Delete module progress
    await supabase
      .from('user_learning_progress')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    // Delete module-specific badge
    if (module) {
      let badgeType = '';
      if (module.category === 'climate_basics') {
        badgeType = 'climate_basics';
      } else if (module.category === 'sustainability') {
        badgeType = 'sustainability';
      }

      if (badgeType) {
        await supabase
          .from('user_badges')
          .delete()
          .eq('user_id', userId)
          .eq('badge_type', badgeType);
      }
    }

    // Check if user still has all other modules complete (for master badge)
    const { data: completedModules } = await supabase
      .from('user_learning_progress')
      .select('module_id')
      .eq('user_id', userId)
      .eq('completed', true);

    // If less than 2 modules complete, remove master badge
    if (!completedModules || completedModules.length < 2) {
      await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', userId)
        .eq('badge_type', 'master');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset progress' },
      { status: 500 }
    );
  }
}
