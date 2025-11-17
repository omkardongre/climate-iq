import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchStoryblokStories } from '@/lib/storyblok';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch user's learning progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from('learning_modules')
      .select('*')
      .order('difficulty', { ascending: true });

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }

    // Get user's progress for each module
    const modulesWithProgress = await Promise.all(
      (modules || []).map(async (module) => {
        const { data: progress } = await supabase
          .from('user_learning_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('module_id', module.id)
          .single();

        // Get actual lesson count from Storyblok
        const storyblokData = await fetchStoryblokStories({
          starts_with: `learning/${module.category}/`,
        });
        const totalLessons = storyblokData?.stories?.length || module.total_lessons || 0;

        // Count completed lessons from user_lesson_progress
        const { data: completedLessons } = await supabase
          .from('user_lesson_progress')
          .select('lesson_number')
          .eq('user_id', userId)
          .eq('module_id', module.id)
          .eq('completed', true);

        const lessonsCompleted = completedLessons?.length || 0;
        const progressPercent = totalLessons > 0 
          ? Math.round((lessonsCompleted / totalLessons) * 100)
          : 0;

        return {
          ...module,
          progress: progressPercent,
          lessonsCompleted,
          totalLessons,
          quizScore: progress?.quiz_score || 0,
          completed: progress?.completed || false,
        };
      })
    );

    return NextResponse.json({ modules: modulesWithProgress });
  } catch (error: any) {
    console.error('Learning progress API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// POST: Update user's learning progress (quiz results only)
export async function POST(request: NextRequest) {
  try {
    const { userId, moduleId, quizScore, completed } = await request.json();

    if (!userId || !moduleId) {
      return NextResponse.json({ error: 'Missing userId or moduleId' }, { status: 400 });
    }

    // Upsert progress (update if exists, insert if not)
    const { data, error } = await supabase
      .from('user_learning_progress')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          quiz_score: quizScore || 0,
          completed: completed || false,
          last_accessed: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : null,
        },
        {
          onConflict: 'user_id,module_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating progress:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: data });
  } catch (error: any) {
    console.error('Update progress API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}
