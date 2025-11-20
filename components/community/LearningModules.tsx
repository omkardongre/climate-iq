'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { QuizModal } from './QuizModal';
import { LessonViewer } from './LessonViewer';

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  icon: string;
  progress: number;
  completed: boolean;
}

export function LearningModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchModules();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchModules = async () => {
    try {
      const response = await fetch(`/api/community/learning-progress?userId=${user?.id}`);
      const data = await response.json();
      
      if (response.ok && data.modules) {
        // Filter out Regional Climate Issues (not implemented)
        const activeModules = data.modules.filter((m: Module) => 
          m.title !== 'Regional Climate Issues'
        );
        setModules(activeModules);
      } else {
        console.error('Failed to fetch modules:', data.error);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async (module: Module) => {
    if (!user) {
      alert('Please sign in to start learning');
      return;
    }

    setActiveModule(module);
    
    // If progress is 100%, show quiz directly
    if (module.progress === 100) {
      await generateQuiz(module);
    } else {
      // Navigate to dedicated lesson page
      window.location.href = `/community/learn/${module.id}`;
    }
  };

  const generateQuiz = async (module: Module) => {
    setQuizLoading(module.id);
    
    try {
      const response = await fetch('/api/community/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.questions) {
        console.log(`✅ Generated ${data.questions.length} questions for ${module.title}`);
        setQuizQuestions(data.questions);
        setShowQuizModal(true);
      } else {
        alert(data.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Check console for details.');
    } finally {
      setQuizLoading(null);
    }
  };

  const handleAllLessonsComplete = () => {
    setShowLessonViewer(false);
    if (activeModule) {
      generateQuiz(activeModule);
    }
  };

  const handleResetProgress = async (moduleId: string) => {
    if (!user) return;
    
    const confirmed = confirm('Reset all progress for this module? This will delete your lessons, quiz scores, and badge.');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/community/reset-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, moduleId }),
      });

      if (response.ok) {
        alert('Progress reset successfully!');
        fetchModules(); // Refresh
      } else {
        alert('Failed to reset progress');
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      alert('Failed to reset progress');
    }
  };

  const handleQuizComplete = async (score: number) => {
    if (!user || !activeModule) return;

    const passed = score >= 60;
    setShowQuizModal(false);

    try {
      // Update progress in database (upsert to avoid duplicate key error)
      const response = await fetch('/api/community/learning-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleId: activeModule.id,
          quizScore: score,
          completed: passed,
        }),
      });

      if (response.ok) {
        console.log('✅ Progress saved to database');
        // Refresh modules to show updated progress
        await fetchModules();
        
        if (passed) {
          alert(`🎉 Congratulations! You scored ${score}% and completed the module!`);
        } else {
          alert(`You scored ${score}%. You need 60% to pass. Try again!`);
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Quiz completed but failed to save results. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <LessonViewer
        isOpen={showLessonViewer}
        onClose={() => setShowLessonViewer(false)}
        moduleId={activeModule?.id || ''}
        moduleTitle={activeModule?.title || ''}
        moduleIcon={activeModule?.icon || '📚'}
        userId={user?.id || ''}
        onAllLessonsComplete={handleAllLessonsComplete}
      />

      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        questions={quizQuestions}
        moduleTitle={activeModule?.title || ''}
        moduleIcon={activeModule?.icon || '📚'}
        onComplete={handleQuizComplete}
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((module) => {
        const colorMap: Record<string, string> = {
          beginner: 'blue',
          intermediate: 'green',
          advanced: 'orange',
        };
        const color = colorMap[module.difficulty] || 'blue';

        return (
          <Card key={module.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {module.icon} {module.title}
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {module.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{module.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold">{module.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${module.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className={`flex-1 bg-${color}-600 hover:bg-${color}-700`}
                  onClick={() => handleStartLearning(module)}
                  disabled={quizLoading === module.id}
                >
                  {quizLoading === module.id 
                    ? 'Generating Quiz...' 
                    : module.completed 
                      ? 'Retake Quiz' 
                      : module.progress === 100
                        ? 'Take Quiz'
                        : module.progress > 0 
                          ? 'Continue Learning' 
                          : 'Start Learning'
                  }
                </Button>
                {module.progress > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetProgress(module.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </>
  );
}
