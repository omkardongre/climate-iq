import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchStoryblokStories } from '@/lib/storyblok';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch lessons for a module with user progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const userId = searchParams.get('userId');

    if (!moduleId) {
      return NextResponse.json({ error: 'Missing moduleId' }, { status: 400 });
    }

    // Get module category from DB
    const { data: module, error: moduleError } = await supabase
      .from('learning_modules')
      .select('category')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      console.error('Error fetching module:', moduleError);
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Fetch lessons from Storyblok
    const storyblokData = await fetchStoryblokStories({
      starts_with: `learning/${module.category}/`,
      sort_by: 'content.lesson_number:asc',
    });

    if (!storyblokData || !storyblokData.stories) {
      console.error('No lessons found in Storyblok');
      return NextResponse.json({ error: 'No lessons found' }, { status: 404 });
    }

    // Map Storyblok stories to lesson format
    const lessons = storyblokData.stories.map((story: any) => ({
      id: story.uuid,
      lesson_number: story.content.lesson_number,
      title: story.content.title,
      content: story.content.content,
      estimated_time_minutes: story.content.estimated_time_minutes,
      featured_image: story.content.featured_image?.filename,
      learning_objectives: story.content.learning_objectives,
    }));

    // If user is logged in, get their progress
    if (userId) {
      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      // Merge progress with lessons
      const lessonsWithProgress = lessons.map((lesson: any) => {
        const userProgress = progress?.find(
          (p: any) => p.lesson_number === lesson.lesson_number
        );
        return {
          ...lesson,
          completed: userProgress?.completed || false,
          timeSpent: userProgress?.time_spent_seconds || 0,
          completedAt: userProgress?.completed_at,
        };
      });

      return NextResponse.json({ lessons: lessonsWithProgress });
    }

    return NextResponse.json({ lessons });
  } catch (error: any) {
    console.error('Lessons API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST: Mark lesson as complete
export async function POST(request: NextRequest) {
  try {
    const { userId, moduleId, lessonNumber, timeSpent } = await request.json();

    if (!userId || !moduleId || lessonNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert lesson progress
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          lesson_number: lessonNumber,
          completed: true,
          time_spent_seconds: timeSpent || 0,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,module_id,lesson_number',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson progress:', error);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    // Get module category to count lessons from Storyblok
    const { data: module } = await supabase
      .from('learning_modules')
      .select('category')
      .eq('id', moduleId)
      .single();

    // Fetch total lessons from Storyblok
    const storyblokData = await fetchStoryblokStories({
      starts_with: `learning/${module?.category}/`,
    });

    const totalLessons = storyblokData?.stories?.length || 0;

    // Get completed lessons from DB
    const { data: completedLessons } = await supabase
      .from('user_lesson_progress')
      .select('lesson_number')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('completed', true);

    const completed = completedLessons?.length || 0;
    const progress = Math.round((completed / totalLessons) * 100);

    // Update module progress (but not completed until quiz is passed)
    await supabase
      .from('user_learning_progress')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          lessons_completed: completed,
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,module_id',
          ignoreDuplicates: false,
        }
      );

    return NextResponse.json({
      success: true,
      progress,
      allLessonsComplete: completed === totalLessons,
    });
  } catch (error: any) {
    console.error('Lesson progress API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}
