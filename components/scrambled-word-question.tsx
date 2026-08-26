'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Lightbulb, Send, Loader } from 'lucide-react';

interface ScrambledWordQuestionProps {
  question: any; // Generic question object from questions table
  onAnswer: (answer: string, isCorrect: boolean, points: number) => void;
  onTimeout?: () => void;
  timeLimit: number;
}

// Utility function to scramble letters
function scrambleWord(word: string): string {
  const letters = word.toUpperCase().split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join(' ');
}

// Utility function to validate answer
function validateAnswer(playerAnswer: string, correctAnswer: string): boolean {
  const playerNormalized = playerAnswer.trim().toUpperCase().replace(/\s+/g, '');
  const correctNormalized = correctAnswer.trim().toUpperCase().replace(/\s+/g, '');
  return playerNormalized === correctNormalized;
}

// Calculate points based on difficulty (marks)
function calculatePoints(marks: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  // Assume marks field stores difficulty multiplier
  // Easy: 1, Medium: 2, Hard: 3
  return marks * 4; // Base is 4 points
}

export default function ScrambledWordQuestion({
  question,
  onAnswer,
  onTimeout,
  timeLimit,
}: ScrambledWordQuestionProps) {
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    points: number;
  } | null>(null);
  const [error, setError] = useState('');

  // Timer effect
  useEffect(() => {
    if (result || timeRemaining <= 0) return;

    const timer = setTimeout(() => {
      const newTime = timeRemaining - 1;
      setTimeRemaining(newTime);

      if (newTime <= 0) {
        handleTimeout();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, result]);

  const handleTimeout = () => {
    setResult({
      isCorrect: false,
      points: 0,
    });
    onTimeout?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const isCorrect = validateAnswer(playerAnswer, question.correct_answer);
      const points = calculatePoints(question.marks, isCorrect);

      setResult({
        isCorrect,
        points,
      });

      onAnswer(playerAnswer, isCorrect, points);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) {
    return null;
  }

  const scrambled = scrambleWord(question.correct_answer);
  const timeColorClass =
    timeRemaining <= 5
      ? 'text-red-600 dark:text-red-400'
      : timeRemaining <= 10
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

  return (
    <div className="w-full space-y-4">
      {/* Header with timer */}
      <div className="flex justify-between items-center">
        <div className="px-3 py-1 bg-purple-100 dark:bg-purple-950/30 rounded-full">
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
            Scrambled Word Challenge
          </p>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${timeColorClass}`}>
          {String(timeRemaining).padStart(2, '0')}s
        </div>
      </div>

      {/* Main Question Card */}
      <Card className="border-border/50 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 shadow-lg">
        <CardContent className="p-8 space-y-6">
          {/* Scrambled Letters Display */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Unscramble the letters:
            </p>
            <div className="text-5xl font-bold text-center tracking-widest text-purple-600 dark:text-purple-400 break-words">
              {scrambled}
            </div>
          </div>

          {/* Hint Button */}
          {question.hint && !result && (
            <Button
              onClick={() => setShowHint(!showHint)}
              variant="outline"
              className="w-full border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
          )}

          {/* Hint Display */}
          {showHint && question.hint && !result && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <strong>Hint:</strong> {question.hint}
              </p>
            </div>
          )}

          {/* Answer Input */}
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="text"
                placeholder="Enter your answer..."
                value={playerAnswer}
                onChange={(e) => setPlayerAnswer(e.target.value)}
                className="bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800 focus:border-purple-500 text-lg"
                disabled={isSubmitting}
                autoFocus
              />
              <Button
                type="submit"
                disabled={!playerAnswer.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Result Display */
            <div
              className={`p-6 rounded-lg border-2 ${
                result.isCorrect
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                  <p className="text-2xl font-bold text-foreground">
                    {question.correct_answer}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                  <p
                    className={`text-lg font-semibold ${
                      result.isCorrect
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {playerAnswer.toUpperCase()}
                  </p>
                </div>

                <div className="pt-2 border-t border-current/10">
                  <p className="text-sm text-muted-foreground mb-2">Points Earned:</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    +{result.points}
                  </p>
                </div>

                <div
                  className={`text-center py-3 rounded font-bold text-lg ${
                    result.isCorrect
                      ? 'bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300'
                  }`}
                >
                  {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
