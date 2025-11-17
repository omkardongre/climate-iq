'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { StoryblokRichText } from './StoryblokRichText';

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  content: string;
  estimated_time_minutes: number;
  completed: boolean;
  timeSpent: number;
}

interface LessonViewerProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleTitle: string;
  moduleIcon: string;
  userId: string;
  onAllLessonsComplete: () => void;
}

export function LessonViewer({
  isOpen,
  onClose,
  moduleId,
  moduleTitle,
  moduleIcon,
  userId,
  onAllLessonsComplete,
}: LessonViewerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (isOpen && moduleId && userId) {
      fetchLessons();
      setStartTime(Date.now());
    }
  }, [isOpen, moduleId, userId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/community/lessons?moduleId=${moduleId}&userId=${userId}`
      );
      const data = await response.json();

      if (response.ok && data.lessons) {
        setLessons(data.lessons);
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
          userId,
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
          onAllLessonsComplete();
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
    }
  };

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setStartTime(Date.now());
    }
  };

  if (loading || lessons.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="text-2xl">{moduleIcon}</span>
            {moduleTitle}
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>
              Lesson {currentLesson.lesson_number} of {lessons.length}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {currentLesson.estimated_time_minutes} min
            </span>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="text-gray-600">
                {completedCount}/{lessons.length} lessons
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Lesson Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentLessonIndex(index);
                  setStartTime(Date.now());
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  index === currentLessonIndex
                    ? 'bg-blue-600 text-white'
                    : lesson.completed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {lesson.completed && <CheckCircle2 className="w-4 h-4" />}
                  <span>Lesson {lesson.lesson_number}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Lesson Content */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                {typeof currentLesson.content === 'string' ? (
                  // Render markdown string (backward compatibility)
                  currentLesson.content.split('\n').map((line, i) => {
                    // Headers
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="text-3xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-2xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                    }
                    // Bullet points
                    if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4 mb-1">{line.slice(2)}</li>;
                    }
                    // Numbered lists
                    if (/^\d+\./.test(line)) {
                      return <li key={i} className="ml-4 mb-1">{line.replace(/^\d+\.\s*/, '')}</li>;
                    }
                    // Bold text
                    if (line.includes('**')) {
                      const parts = line.split('**');
                      return (
                        <p key={i} className="mb-2">
                          {parts.map((part, j) => 
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )}
                        </p>
                      );
                    }
                    // Empty line
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    // Regular paragraph
                    return <p key={i} className="mb-2">{line}</p>;
                  })
                ) : (
                  // Render Storyblok rich text
                  <StoryblokRichText content={currentLesson.content} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Completion Status */}
          {currentLesson.completed && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">
                Lesson completed! Great job! 🎉
              </span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentLessonIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-gray-600">
              {currentLessonIndex === lessons.length - 1 && completedCount === lessons.length
                ? 'All lessons complete! Close to take the quiz.'
                : `${lessons.length - completedCount} lessons remaining`}
            </div>

            {currentLessonIndex < lessons.length - 1 ? (
              <Button onClick={handleNext}>
                {currentLesson.completed ? 'Next Lesson' : 'Complete & Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (!currentLesson.completed) {
                    await handleCompleteLesson();
                  }
                  onClose();
                }}
              >
                {currentLesson.completed ? 'Close' : 'Complete & Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
