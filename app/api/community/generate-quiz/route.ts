import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { fetchStoryblokStories } from '@/lib/storyblok';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    const { moduleId, userId } = await request.json();

    if (!moduleId) {
      return NextResponse.json({ error: 'Missing moduleId' }, { status: 400 });
    }

    // Get module info from database
    const { data: module, error: moduleError } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Fetch lesson content from Storyblok
    const storyblokData = await fetchStoryblokStories({
      starts_with: `learning/${module.category}/`,
      sort_by: 'content.lesson_number:asc',
    });

    if (!storyblokData || !storyblokData.stories || storyblokData.stories.length === 0) {
      return NextResponse.json({ error: 'No lessons found for this module' }, { status: 404 });
    }

    // Extract lesson content for quiz generation
    const lessonSummaries = storyblokData.stories.map((story: any) => {
      const content = story.content.content;
      let textContent = '';
      
      // Extract text from Storyblok rich text structure
      if (content && content.content) {
        content.content.forEach((node: any) => {
          if (node.type === 'code_block' && node.content) {
            textContent += node.content.map((c: any) => c.text).join('') + '\n';
          }
        });
      }
      
      return `Lesson ${story.content.lesson_number}: ${story.content.title}\n${textContent.substring(0, 500)}...`;
    }).join('\n\n');

    // Generate quiz questions using Gemini based on actual lesson content
    const prompt = `Based on the following lesson content, generate a 5-question multiple choice quiz about "${module.title}".

LESSON CONTENT:
${lessonSummaries}

Create questions that test understanding of the key concepts covered in these lessons.

Format as JSON array:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Why this is correct"
  }
]

Make questions educational and engaging. Include real-world examples from the lessons.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid quiz format');
    }

    return NextResponse.json({ 
      questions,
      moduleId,
      moduleTitle: module.title,
      moduleCategory: module.category
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
