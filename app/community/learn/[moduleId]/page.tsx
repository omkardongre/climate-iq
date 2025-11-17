'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, ArrowRight, ArrowLeft, Home, Trophy } from 'lucide-react';
import { StoryblokRichText } from '@/components/community/StoryblokRichText';
import { useAuth } from '@/components/auth-provider';
import { QuizModal } from '@/components/community/QuizModal';

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  content: any;
  estimated_time_minutes: number;
  featured_image?: string;
  learning_objectives?: string;
  completed: boolean;
  timeSpent: number;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const moduleId = params.moduleId as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [moduleInfo, setModuleInfo] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [allLessonsComplete, setAllLessonsComplete] = useState(false);

  useEffect(() => {
    if (moduleId && user) {
      fetchLessons();
      fetchModuleInfo();
      setStartTime(Date.now());
    }
  }, [moduleId, user]);

  const fetchModuleInfo = async () => {
    try {
      const response = await fetch(`/api/community/learning-modules?userId=${user?.id}`);
      const data = await response.json();
      const module = data.modules?.find((m: any) => m.id === moduleId);
      setModuleInfo(module);
    } catch (error) {
      console.error('Error fetching module info:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/community/lessons?moduleId=${moduleId}&userId=${user?.id}`
      );
      const data = await response.json();

      if (response.ok && data.lessons) {
        setLessons(data.lessons);
        // Check if all lessons are complete
        const allComplete = data.lessons.every((l: Lesson) => l.completed);
        setAllLessonsComplete(allComplete);
        // Start from first incomplete lesson
        const firstIncomplete = data.lessons.findIndex((l: Lesson) => !l.completed);
        setCurrentLessonIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await fetch('/api/community/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          moduleId,
          lessonNumber: currentLesson.lesson_number,
          timeSpent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        const updatedLessons = [...lessons];
        updatedLessons[currentLessonIndex].completed = true;
        setLessons(updatedLessons);

        // Check if all lessons complete
        if (data.allLessonsComplete) {
          setAllLessonsComplete(true);
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleNext = async () => {
    if (!currentLesson.completed) {
      await handleCompleteLesson();
    }

    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setStartTime(Date.now());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setStartTime(Date.now());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTakeQuiz = async () => {
    setQuizLoading(true);
    try {
      const response = await fetch('/api/community/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, userId: user?.id }),
      });

      const data = await response.json();

      if (response.ok && data.questions) {
        setQuizData(data);
        setShowQuiz(true);
      } else {
        alert('Failed to generate quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    setShowQuiz(false);
    
    try {
      // Save quiz attempt and update progress
      const response = await fetch('/api/community/learning-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          moduleId,
          quizScore: score,
          completed: passed,
        }),
      });

      if (response.ok) {
        // Refresh module info to show updated progress
        await fetchModuleInfo();
        
        if (passed) {
          alert(`🎉 Congratulations! You scored ${score}% and completed the module!`);
        } else {
          alert(`You scored ${score}%. You need 60% to pass. Try again!`);
        }
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
      alert('Quiz completed but failed to save results. Please try again.');
    }
  };

  if (loading || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/community?tab=learn')}
            className="mb-4"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Learning
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <span className="text-4xl">{moduleInfo?.icon || '📚'}</span>
                {moduleInfo?.title || 'Learning Module'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Lesson {currentLesson.lesson_number} of {lessons.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {progressPercent}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Lesson Navigation Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => {
                setCurrentLessonIndex(index);
                setStartTime(Date.now());
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                index === currentLessonIndex
                  ? 'bg-blue-600 text-white shadow-lg'
                  : lesson.completed
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {lesson.completed && <CheckCircle2 className="w-4 h-4" />}
                <span>Lesson {lesson.lesson_number}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Lesson Content Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {/* Lesson Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold">{currentLesson.title}</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>{currentLesson.estimated_time_minutes} min</span>
                </div>
              </div>

              {/* Featured Image */}
              {currentLesson.featured_image && (
                <img
                  src={currentLesson.featured_image}
                  alt={currentLesson.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {/* Learning Objectives */}
              {currentLesson.learning_objectives && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">📚 Learning Objectives:</h3>
                  <div className="text-sm whitespace-pre-line">
                    {currentLesson.learning_objectives}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {typeof currentLesson.content === 'string' ? (
                // Render markdown string
                <div className="whitespace-pre-wrap">{currentLesson.content}</div>
              ) : (
                // Render Storyblok rich text
                <StoryblokRichText content={currentLesson.content} />
              )}
            </div>

            {/* Completion Status */}
            {currentLesson.completed && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Lesson completed! Great job! 🎉
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Lessons Complete - Quiz Section */}
        {allLessonsComplete && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold mb-2">🎉 All Lessons Complete!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You've completed all {lessons.length} lessons. Ready to test your knowledge?
              </p>
              <Button
                onClick={handleTakeQuiz}
                disabled={quizLoading}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {quizLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    Take Final Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentLessonIndex === 0}
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-center text-sm text-gray-600">
            {allLessonsComplete
              ? '✅ All lessons complete! Take the quiz above.'
              : `${lessons.length - completedCount} lessons remaining`}
          </div>

          {currentLessonIndex < lessons.length - 1 ? (
            <Button onClick={handleNext} size="lg">
              {currentLesson.completed ? 'Next Lesson' : 'Complete & Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={async () => {
                if (!currentLesson.completed) {
                  await handleCompleteLesson();
                }
              }}
              size="lg"
              disabled={currentLesson.completed}
            >
              {currentLesson.completed ? '✅ All Complete!' : 'Complete Final Lesson'}
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && quizData && (
        <QuizModal
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          moduleTitle={moduleInfo?.title || 'Module'}
          moduleIcon={moduleInfo?.icon || '📚'}
          questions={quizData.questions}
          onComplete={(score) => {
            const passed = score >= 60;
            handleQuizComplete(score, passed);
          }}
        />
      )}
    </div>
  );
}
