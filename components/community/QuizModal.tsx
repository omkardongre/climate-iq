'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Award } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  moduleTitle: string;
  moduleIcon: string;
  onComplete: (score: number) => void;
}

export function QuizModal({ isOpen, onClose, questions, moduleTitle, moduleIcon, onComplete }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when modal opens with new questions
  useEffect(() => {
    if (isOpen && questions && questions.length > 0) {
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setScore(0);
      setIsComplete(false);
    }
  }, [isOpen, questions]);

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      setIsComplete(true);
      const finalScore = Math.round((score / questions.length) * 100);
      onComplete(finalScore);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setIsComplete(false);
  };

  const handleClose = () => {
    handleRestart();
    onClose();
  };

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {moduleIcon} Quiz Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="mb-6">
              {passed ? (
                <Award className="w-24 h-24 mx-auto text-green-500" />
              ) : (
                <div className="text-6xl">📚</div>
              )}
            </div>
            <h3 className="text-3xl font-bold mb-4">
              {passed ? '🎉 Congratulations!' : 'Keep Learning!'}
            </h3>
            <p className="text-xl mb-6">
              You scored <span className="font-bold text-green-600">{score}</span> out of{' '}
              <span className="font-bold">{questions.length}</span>
            </p>
            <div className="text-5xl font-bold mb-6" style={{ color: passed ? '#22c55e' : '#f59e0b' }}>
              {percentage}%
            </div>
            {passed ? (
              <p className="text-gray-600 mb-8">
                Great job! You've mastered {moduleTitle}. Badge unlocked! 🏆
              </p>
            ) : (
              <p className="text-gray-600 mb-8">
                You need 60% to pass. Review the material and try again!
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRestart} variant="outline">
                Retake Quiz
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Safety check for questions
  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentQuestion];
  if (!currentQ) {
    return null;
  }

  const isCorrect = selectedAnswer === currentQ.correctAnswer;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {moduleIcon} {moduleTitle}
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span>Score: {score}/{currentQuestion + (showExplanation ? 1 : 0)}</span>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question */}
          <h3 className="text-lg font-semibold mb-6">{currentQ.question}</h3>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQ.correctAnswer;
              const showCorrect = showExplanation && isCorrectOption;
              const showWrong = showExplanation && isSelected && !isCorrect;

              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    isSelected && !showExplanation
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : showCorrect
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : showWrong
                      ? 'ring-2 ring-red-500 bg-red-50'
                      : 'hover:bg-gray-50'
                  } ${showExplanation ? 'cursor-default' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isSelected && !showExplanation
                            ? 'bg-blue-500 text-white'
                            : showCorrect
                            ? 'bg-green-500 text-white'
                            : showWrong
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-base">{option}</span>
                    </div>
                    {showCorrect && <CheckCircle2 className="text-green-500 w-6 h-6" />}
                    {showWrong && <XCircle className="text-red-500 w-6 h-6" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <Card className={`${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="text-red-500 w-6 h-6 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <p className="font-semibold mb-2">
                      {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </p>
                    <p className="text-gray-700">{currentQ.explanation}</p>
                    {!isCorrect && (
                      <p className="mt-2 text-sm text-gray-600">
                        The correct answer is: <strong>{currentQ.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleClose}>
              Exit Quiz
            </Button>
            {!showExplanation ? (
              <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
