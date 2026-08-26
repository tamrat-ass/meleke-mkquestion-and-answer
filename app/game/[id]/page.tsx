'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { SignScreen } from '@/components/sign-screen';
import { QuestionTimer } from '@/components/question-timer';
import { MultipleChoiceQuestion } from '@/components/multiple-choice-question';
import { ShortAnswerQuestion } from '@/components/short-answer-question';
import { GeneralKnowledgeQuestion } from '@/components/general-knowledge-question';

interface Question {
  id: string;
  title: string;
  question_type: string;
  difficulty: number;
  created_at: string;
  round_id: string;
  round_name: string;
  correct_answer?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  options?: Array<{ option_key: string; option_value: string }>;
  time_limit?: number;
  minimum_time_frame?: number;
  marks?: number;
  status?: string;
}

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const gameId = params.id as string;

  const [game, setGame] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [clickedTypes, setClickedTypes] = useState<Set<string>>(new Set());
  const [clickedQuestions, setClickedQuestions] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const getCorrectAnswerLetter = (correctAnswer: any): string => {
    if (!correctAnswer) return '';
    
    // Handle if it's an object
    if (typeof correctAnswer === 'object' && correctAnswer !== null) {
      correctAnswer = correctAnswer.value || correctAnswer.answer || '';
    }
    
    // Convert to string, trim, uppercase, and take first character
    return String(correctAnswer).trim().toUpperCase().charAt(0);
  };

  const getAnswerDisplay = (question: Question) => {
    if (question.question_type === 'short_answer') {
      return question.correct_answer;
    }
    
    const answerLetter = getCorrectAnswerLetter(question.correct_answer);
    
    // For multiple choice, show "A. option text"
    const optionText = 
      answerLetter === 'A' ? question.option_a :
      answerLetter === 'B' ? question.option_b :
      answerLetter === 'C' ? question.option_c :
      answerLetter === 'D' ? question.option_d :
      '';
    return `${answerLetter}. ${optionText}`;
  };

  // Update game status based on completion
  React.useEffect(() => {
    if (!game || questions.length === 0) return;

    // Check if all questions are answered
    const allQuestionsAnswered = questions.every(q => clickedQuestions.has(q.id));
    
    // Determine new status
    let newStatus = 'active'; // Default when game is open
    
    if (allQuestionsAnswered && questions.length > 0 && clickedQuestions.size > 0) {
      newStatus = 'completed';
    } else if (clickedQuestions.size > 0 && !allQuestionsAnswered) {
      newStatus = 'pending';
    }

    // Only update if status actually changed
    if (game.status !== newStatus) {
      console.log(`Game status changing: ${game.status} → ${newStatus}`);
      
      // Update game status in database
      fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      .then(res => {
        if (res.ok) {
          console.log('Game status updated successfully');
          // Update local game state
          setGame({ ...game, status: newStatus });
        }
      })
      .catch(error => console.error('Error updating game status:', error));
    }
  }, [clickedQuestions, questions, gameId, game]);

  useEffect(() => {
    // Check user role from session/localStorage
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/auth/debug');
        const data = await response.json();
        const role = data.user?.role_name;
        setUserRole(role);
        
        // Allow both players and admins to access game
        if (role && role !== 'player' && role !== 'admin') {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }
        
        fetchGameData();
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [gameId]);

  useEffect(() => {
    // Initialize timer display when question is selected (but don't start counting)
    if (selectedQuestion && timeLeft === 0) {
      const timeLimit = selectedQuestion.time_limit || 30;
      setTimeLeft(timeLimit);
    }
  }, [selectedQuestion]);

  // Auto-mark general knowledge questions as OPENED when displayed
  useEffect(() => {
    if (selectedQuestion && (selectedQuestion.question_type === 'general_knowledge' || selectedQuestion.question_type?.toLowerCase().includes('general'))) {
      // Check if question is NOT already OPENED
      if (selectedQuestion.status !== 'OPENED') {
        // Automatically mark as OPENED when displayed
        fetch(`/api/questions/${selectedQuestion.id}/mark-opened`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        .then(res => {
          if (res.ok) {
            console.log(`General Knowledge Question ${selectedQuestion.id} auto-marked as OPENED`);
            // Update local state to reflect opened status
            setSelectedQuestion(prev => prev ? { ...prev, status: 'OPENED' } : null);
          }
        })
        .catch(error => console.error('Error auto-marking question as opened:', error));
      }
    }
  }, [selectedQuestion?.id]); // Only run when question ID changes

  // Always check for minimum time frame - play audio from database value (no hard-coded fallback)
  useEffect(() => {
    if (selectedQuestion && selectedQuestion.minimum_time_frame && timeLeft === selectedQuestion.minimum_time_frame && timeLeft > 0) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error('Audio playback failed:', error);
        });
      }
    }
  }, [timeLeft, selectedQuestion]);

  useEffect(() => {
    if (!timerActive || timeLeft < 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // When time is up
        if (newTime <= 0) {
          setTimerActive(false);
          // If no answer was selected, show answer after 3 seconds
          if (!answerResult) {
            setTimeout(() => {
              setAnswerResult({
                correct: true,
                message: `✓ ${t('game.timeUp')}`
              });
              setShowAnswer(true);
            }, 3000);
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const fetchGameData = async () => {
    try {
      const gameRes = await fetch(`/api/games/${gameId}`);
      if (gameRes.ok) {
        const gameData = await gameRes.json();
        setGame(gameData.game);

        // Fetch all questions and filter by round_id
        if (gameData.game.round_id) {
          const questionsRes = await fetch(`/api/questions`);
          if (questionsRes.ok) {
            const questionsData = await questionsRes.json();
            
            // Filter questions by round_id
            const roundQuestions = (questionsData.questions || []).filter(
              (q: any) => q.round_id === gameData.game.round_id
            );
            setQuestions(roundQuestions);
          } else {
            console.error('Failed to fetch questions:', questionsRes.status);
          }
        }
      } else {
        console.error('Failed to fetch game:', gameRes.status);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    const type = question.question_type || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  // Define the preferred order of question types
  const typeOrder = ['multiple_choice', 'short_answer', 'sign_screen'];
  const questionTypes = Object.keys(groupedQuestions).sort((a, b) => {
    const indexA = typeOrder.indexOf(a);
    const indexB = typeOrder.indexOf(b);
    
    // If both are in the preferred order, sort by that
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only a is in the preferred order, it comes first
    if (indexA !== -1) return -1;
    // If only b is in the preferred order, it comes first
    if (indexB !== -1) return 1;
    // Otherwise, keep alphabetical order
    return a.localeCompare(b);
  });
  const selectedTypeQuestions = selectedType ? groupedQuestions[selectedType] : [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-red-500/50 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-600">{t('game.accessDenied')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <p className="text-muted-foreground">
              Only players can access games. Your current role is: <span className="font-semibold capitalize">{userRole}</span>
            </p> */}
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              {t('common.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center text-muted-foreground">{t('play.noGamesAvailable')}</div>
      </div>
    );
  }

  // Show session finished screen if all general knowledge questions are opened and user clicked the type
  if (answerResult?.message === t('game.sessionFinished') && !selectedQuestion) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-2xl border-2 border-green-500/50 bg-green-500/10">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-green-700 mb-2">
                {t('game.sessionFinished')}
              </h2>
            </div>
            <Button
              onClick={() => {
                // Just go back to question type selection
                // Status remains OPENED - only admin can reset
                setSelectedQuestion(null);
                setSelectedType(null);
                setAnswerResult(null);
                setTimerActive(false);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold"
            >
              {t('game.backToTypes')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show question detail view
  if (selectedQuestion) {
    // Handle sign_screen question type - special display, no answers
    if (selectedQuestion.question_type === 'sign_screen') {
      return (
        <div className="min-h-screen w-full">
          <SignScreen
            question={{
              id: selectedQuestion.id,
              question_text: selectedQuestion.title || '',
              time_limit: selectedQuestion.time_limit || 60
            }}
            minimumTime={selectedQuestion.minimum_time_frame || 1}
            onBack={() => {
              // Go back to question type selection
              setSelectedQuestion(null);
              setShowAnswer(false);
              setSelectedAnswer(null);
              setAnswerResult(null);
              setTimeLeft(0);
            }}
            onTimeUp={() => {
              // Auto-advance to next question
              const currentIndex = selectedTypeQuestions.indexOf(selectedQuestion);
              if (currentIndex < selectedTypeQuestions.length - 1) {
                const nextQuestion = selectedTypeQuestions[currentIndex + 1];
                setTimeout(async () => {
                  try {
                    const res = await fetch(`/api/questions/${nextQuestion.id}`);
                    if (res.ok) {
                      const data = await res.json();
                      setSelectedQuestion({
                        ...data.question,
                        title: data.question.question_text || data.question.title
                      });
                    }
                  } catch (error) {
                    console.error('Error fetching next question:', error);
                  }
                }, 300);
              } else {
                // End of questions - go back to type selection
                setSelectedQuestion(null);
                setShowAnswer(false);
                setSelectedAnswer(null);
                setAnswerResult(null);
                setTimeLeft(0);
              }
            }}
          />
          {/* Back button overlay */}
          <button
            onClick={() => {
              setSelectedQuestion(null);
              setShowAnswer(false);
              setSelectedAnswer(null);
              setAnswerResult(null);
              setTimeLeft(0);
            }}
            className="absolute top-6 left-6 z-50 p-2 hover:opacity-80 transition-opacity bg-white/10 backdrop-blur rounded-lg"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        </div>
      );
    }

    // Handle general_knowledge question type with new UI
    if (selectedQuestion.question_type === 'general_knowledge' || selectedQuestion.question_type.toLowerCase().includes('general')) {
      // Check if session is finished (no more unopened questions)
      const isSessionFinished = answerResult?.message === t('game.sessionFinished');

      if (isSessionFinished) {
        return (
          <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-2xl border-2 border-green-500/50 bg-green-500/10">
              <CardContent className="pt-12 pb-12 text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-green-700 mb-2">
                    {t('game.sessionFinished')}
                  </h2>
                </div>
                <Button
                  onClick={async () => {
                    // Reset all question statuses for this round
                    try {
                      // Get user from localStorage
                      const storedUser = localStorage.getItem('user');
                      const user = storedUser ? JSON.parse(storedUser) : null;

                      await fetch('/api/admin/reset-question-status', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-user-id': user?.id?.toString() || '',
                        },
                        body: JSON.stringify({ round_id: game.round_id }),
                      });
                    } catch (error) {
                      console.error('Error resetting question statuses:', error);
                    }
                    
                    // Clear UI state
                    setSelectedQuestion(null);
                    setSelectedType(null);
                    setAnswerResult(null);
                    setTimerActive(false);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold"
                >
                  {t('game.backToTypes')}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <GeneralKnowledgeQuestion
          questionNumber={selectedQuestionIndex + 1}
          totalQuestions={selectedTypeQuestions.length}
          question={selectedQuestion.title}
          timeLeft={timeLeft}
          totalTime={selectedQuestion.time_limit || 30}
          minimumTime={selectedQuestion.minimum_time_frame || 1}
          onBack={() => {
            setTimerActive(false);
            setSelectedQuestion(null);
            setShowAnswer(false);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setTimeLeft(0);
            setSelectedType(null);
          }}
          onTimerClick={() => {
            if (!timerActive) {
              const timeLimit = selectedQuestion?.time_limit || 30;
              setTimeLeft(timeLimit);
              setTimerActive(true);
            }
          }}
          onNextQuestion={async () => {
            // Mark current question as OPENED
            try {
              await fetch(`/api/questions/${selectedQuestion.id}/mark-opened`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
            } catch (error) {
              console.error('Error marking question as opened:', error);
            }

            // Fetch next unopened question
            try {
              const res = await fetch(
                `/api/questions/next-unopened?round_id=${game.round_id}&question_type=${encodeURIComponent(selectedQuestion.question_type)}`
              );
              if (res.ok) {
                const data = await res.json();
                if (data.question) {
                  // Found next unopened question
                  setSelectedQuestion({
                    ...data.question,
                    title: data.question.title || data.question.question_text
                  });
                } else {
                  // No more unopened questions - session finished
                  setAnswerResult({
                    correct: true,
                    message: t('game.sessionFinished')
                  });
                }
              }
            } catch (error) {
              console.error('Error fetching next question:', error);
            }
          }}
        />
      );
    }

    // Handle multiple choice with new UI
    if (selectedQuestion.question_type === 'multiple_choice') {
      const mcOptions = [
        { key: 'A', value: selectedQuestion.option_a },
        { key: 'B', value: selectedQuestion.option_b },
        { key: 'C', value: selectedQuestion.option_c },
        { key: 'D', value: selectedQuestion.option_d }
      ].filter((opt): opt is { key: string; value: string } => Boolean(opt.value));

      return (
        <MultipleChoiceQuestion
          questionNumber={selectedQuestionIndex + 1}
          totalQuestions={selectedTypeQuestions.length}
          question={selectedQuestion.title}
          options={mcOptions}
          timeLeft={timeLeft}
          totalTime={selectedQuestion.time_limit || 30}
          minimumTime={selectedQuestion.minimum_time_frame || 1}
          selectedAnswer={selectedAnswer}
          correctAnswer={
            answerResult
              ? `${String(selectedQuestion.correct_answer).toUpperCase()}. ${
                  String(selectedQuestion.correct_answer).toUpperCase() === 'A' ? selectedQuestion.option_a :
                  String(selectedQuestion.correct_answer).toUpperCase() === 'B' ? selectedQuestion.option_b :
                  String(selectedQuestion.correct_answer).toUpperCase() === 'C' ? selectedQuestion.option_c :
                  selectedQuestion.option_d
                }`
              : undefined
          }
          showResult={answerResult !== null}
          isCorrect={answerResult?.correct || false}
          onSelectAnswer={(selectedKey) => {
            if (!answerResult) {
              setSelectedAnswer(selectedKey);
              const correct = selectedKey === String(selectedQuestion.correct_answer).toUpperCase();
              setAnswerResult({
                correct: correct,
                message: correct ? t('game.correctAnswer') : t('game.wrongAnswer')
              });
              // Stop the timer and audio when answer is selected
              setTimerActive(false);
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }

              // Save answer to database if correct
              if (correct && game) {
                const marksObtained = correct ? (selectedQuestion.marks || 1) : 0;
                fetch('/api/game-answers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    game_id: game.id,
                    question_id: selectedQuestion.id,
                    user_answer: selectedKey,
                    is_correct: correct,
                    marks_obtained: marksObtained
                  })
                }).catch(error => console.error('Error saving answer:', error));
              }
            }
          }}
          onTimerClick={() => {
            if (!timerActive) {
              const timeLimit = selectedQuestion?.time_limit || 30;
              setTimeLeft(timeLimit);
              setTimerActive(true);
            }
          }}
          onBack={() => {
            setTimerActive(false);
            setSelectedQuestion(null);
            setShowAnswer(false);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setTimeLeft(0);
          }}
        />
      );
    }

    // Handle short answer questions with new UI
    if (selectedQuestion.question_type === 'short_answer') {
      return (
        <ShortAnswerQuestion
          questionNumber={selectedQuestionIndex + 1}
          totalQuestions={selectedTypeQuestions.length}
          question={selectedQuestion.title}
          answer={showAnswer ? selectedQuestion.correct_answer : undefined}
          showResult={showAnswer}
          timeLeft={timeLeft}
          totalTime={selectedQuestion.time_limit || 30}
          minimumTime={selectedQuestion.minimum_time_frame || 1}
          onShowAnswer={() => {
            setShowAnswer(true);
          }}
          onBack={() => {
            setTimerActive(false);
            setSelectedQuestion(null);
            setShowAnswer(false);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setTimeLeft(0);
          }}
          onTimerClick={() => {
            if (!timerActive) {
              const timeLimit = selectedQuestion?.time_limit || 30;
              setTimeLeft(timeLimit);
              setTimerActive(true);
            }
          }}
        />
      );
    }

    // Handle other question types (true/false, etc.) - use previous UI
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background relative">
        {/* Logo in top left - go back to previous page */}
        <button
          onClick={() => {
            setTimerActive(false);
            setSelectedQuestion(null);
            setShowAnswer(false);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setTimeLeft(0);
          }}
          className="absolute left-6 top-6 hover:opacity-80 transition-opacity"
        >
          <img src="/images/mk.png" alt="MK Back" className="h-20 w-auto cursor-pointer" />
        </button>

        {/* Centered Timer - Outside Container */}
        {!answerResult && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-30">
            {timerActive && timeLeft > 0 ? (
              <QuestionTimer
                timeLeft={timeLeft}
                totalTime={selectedQuestion.time_limit || 30}
                minimumTime={selectedQuestion.minimum_time_frame || 1}
                isActive={timerActive}
              />
            ) : null}
          </div>
        )}

        {/* Logo in top right - clickable to start timer */}
        <button
          onClick={() => {
            if (!timerActive) {
              const timeLimit = selectedQuestion?.time_limit || 30;
              setTimeLeft(timeLimit);
              setTimerActive(true);
            }
          }}
          className="absolute right-6 top-6 hover:opacity-80 transition-opacity"
        >
          <img src="/images/logo.jpg" alt="Logo" className="h-20 w-auto cursor-pointer" />
        </button>

        <Card className="w-full max-w-4xl border-2 border-border/50 bg-card shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-4xl text-center">
              {selectedQuestionIndex + 1}. {selectedQuestion.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Hidden audio element for alarm */}
            <audio ref={audioRef} src="/audio/alarm.wav" />

            {/* View Answer button for short answer questions */}
            {selectedQuestion.question_type === 'short_answer' && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border/50"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  {showAnswer ? t('game.hideAnswer') : t('game.viewAnswer')}
                </Button>
              </div>
            )}

            {/* Show options for multiple choice - always visible */}
            {selectedQuestion.question_type === 'multiple_choice' || (selectedQuestion.option_a || selectedQuestion.option_b || selectedQuestion.option_c || selectedQuestion.option_d) ? (
              <div className="space-y-3">
                <div className="grid gap-4 grid-cols-2">
                  {[
                    { key: 'A', value: selectedQuestion.option_a },
                    { key: 'B', value: selectedQuestion.option_b },
                    { key: 'C', value: selectedQuestion.option_c },
                    { key: 'D', value: selectedQuestion.option_d }
                  ].filter(opt => opt.value).map((option) => {
                    const isCorrect = showAnswer && option.key === String(selectedQuestion.correct_answer).toUpperCase();
                    const isSelected = selectedAnswer === option.key;
                    
                    return (
                      <button
                        key={option.key}
                        onClick={() => {
                          if (!answerResult) {
                            setSelectedAnswer(option.key);
                            const correct = option.key === String(selectedQuestion.correct_answer).toUpperCase();
                            setAnswerResult({
                              correct: correct,
                              message: correct ? t('game.correctAnswer') : t('game.wrongAnswer')
                            });
                            // Stop the timer and audio when answer is selected
                            setTimerActive(false);
                            if (audioRef.current) {
                              audioRef.current.pause();
                              audioRef.current.currentTime = 0;
                            }
                            
                            // Save answer to database if correct
                            if (correct && game) {
                              const marksObtained = correct ? (selectedQuestion.marks || 1) : 0;
                              fetch('/api/game-answers', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  game_id: game.id,
                                  question_id: selectedQuestion.id,
                                  user_answer: option.key,
                                  is_correct: correct,
                                  marks_obtained: marksObtained
                                })
                              }).catch(error => console.error('Error saving answer:', error));
                            }
                          }
                        }}
                        disabled={answerResult !== null}
                        className={`p-6 border-2 rounded-lg transition-colors text-center font-semibold cursor-pointer disabled:cursor-not-allowed ${
                          isSelected && answerResult?.correct
                            ? 'border-green-500/80 bg-green-500/20 text-green-700'
                            : isSelected && !answerResult?.correct
                            ? 'border-red-500/80 bg-red-500/20 text-red-700'
                            : showAnswer && isCorrect
                            ? 'border-green-500/80 bg-green-500/20 text-green-700'
                            : 'border-blue-400/50 bg-blue-50/30 text-blue-700 hover:border-blue-500/80'
                        }`}
                      >
                        <div className="text-3xl">{option.key}. {option.value || '(empty)'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Answer Result Card */}
            {answerResult && selectedQuestion && (
              <Card className={`border-2 ${answerResult.correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                <CardContent className="pt-6 pb-6">
                  <div className="text-center space-y-4">
                    <p className={`text-2xl font-bold ${answerResult.correct ? 'text-green-600' : 'text-red-600'}`}>
                      {answerResult.message}
                    </p>
                    {!answerResult.correct && (
                      <p className="text-2xl font-bold text-green-600">
                        {t('game.correct')}: {getAnswerDisplay(selectedQuestion)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Answer Card - Separate - Only show when answer is revealed */}
            {showAnswer && selectedQuestion && (
              <Card className="border-border/50 bg-card border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-600"> </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 border-2 border-green-500/80 bg-green-500/20 rounded-lg text-center">
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">
                        {t('game.correct')}: {getAnswerDisplay(selectedQuestion)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show questions list for selected type
  if (selectedType) {
    // Translate question type names
    const getQuestionTypeName = (name: string) => {
      const typeMap: { [key: string]: string } = {
        'multiple_choice': t('questions.multipleChoice'),
        'true_false': t('questions.trueOrFalse'),
        'short_answer': t('questions.shortAnswer'),
        'essay': t('questions.essay'),
        'matching': t('questions.matching'),
        'sign_screen': t('questions.signScreen'),
        'general_knowledge': t('questions.generalKnowledge'),
      };
      return typeMap[name] || name;
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-6 relative overflow-hidden bg-gradient-to-br from-[#4d0000] via-[#7a0000] to-[#3d0000]">
        {/* Red Wavy Pattern - Bottom Left */}
        <div
          className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' stroke-width='0.5' opacity='0.8'%3E%3Cpath d='M10 50 Q 25 30, 40 50 T 70 50 T 100 50'/%3E%3Cpath d='M10 60 Q 25 40, 40 60 T 70 60 T 100 60'/%3E%3Cpath d='M10 70 Q 25 50, 40 70 T 70 70 T 100 70'/%3E%3Cpath d='M10 80 Q 25 60, 40 80 T 70 80 T 100 80'/%3E%3Cpath d='M10 90 Q 25 70, 40 90 T 70 90 T 100 90'/%3E%3Cpath d='M10 40 Q 25 20, 40 40 T 70 40 T 100 40'/%3E%3Cpath d='M10 30 Q 25 10, 40 30 T 70 30 T 100 30'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '400px 400px',
            backgroundPosition: '0 0',
          }}
        />

        {/* Dot Pattern - Right Side Fade */}
        <div
          className="absolute top-0 right-0 w-full h-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 85% 50%, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 25%, rgba(239, 68, 68, 0.02) 50%, transparent 100%)`,
          }}
        />

        {/* Subtle Dot Grid - Right Side */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.6) 1.5px, transparent 1.5px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0',
          }}
        />

        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-900/50 to-transparent" />
        </div>

        <div className="w-full max-w-6xl relative z-10">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedType(null);
              setClickedQuestions(new Set());
            }}
            className="text-white hover:text-red-200 transition-colors p-2 hover:bg-white/10 rounded-lg mb-8"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Main Title for Questions List */}
          <div className="w-full mb-12 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
              {getQuestionTypeName(selectedType)}
            </h1>
            <p className="text-lg md:text-xl text-red-100">
              {t('game.selectQuestion')}
            </p>
          </div>

          <div className="grid gap-6 grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 mb-12 auto-rows-fr">
            {selectedTypeQuestions.map((question, index) => (
              <div
                key={question.id}
                onClick={() => {
                  const newClicked = new Set(clickedQuestions);
                  newClicked.add(question.id);
                  setClickedQuestions(newClicked);
                  // Store the question index
                  const idx = selectedTypeQuestions.indexOf(question);
                  setSelectedQuestionIndex(idx);
                  // Fetch full question data including options
                  setTimeout(async () => {
                    try {
                      const res = await fetch(`/api/questions/${question.id}`);
                      if (res.ok) {
                        const data = await res.json();
                        // Map question_text to title for consistency
                        setSelectedQuestion({
                          ...data.question,
                          title: data.question.question_text || data.question.title
                        });
                      } else {
                        setSelectedQuestion(question);
                      }
                    } catch (error) {
                      console.error('Error fetching question:', error);
                      setSelectedQuestion(question);
                    }
                  }, 100);
                }}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer p-8 flex items-center justify-center min-h-40 ${
                  clickedQuestions.has(question.id)
                    ? 'bg-gray-400 border-gray-600 shadow-2xl shadow-gray-600/40 hover:shadow-2xl'
                    : 'bg-white border-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  clickedQuestions.has(question.id)
                    ? 'bg-gradient-to-br from-gray-500/40 to-transparent'
                    : 'bg-gradient-to-br from-red-100/40 to-transparent'
                }`} />
                <div className="relative z-10 text-center">
                  <div className={`text-5xl md:text-6xl font-bold transition-colors ${
                    clickedQuestions.has(question.id)
                      ? 'text-red-600'
                      : 'text-red-600 group-hover:text-red-700'
                  }`}>
                    {index + 1}
                  </div>
                  <p className={`text-sm md:text-base mt-2 font-medium ${
                    clickedQuestions.has(question.id)
                      ? 'text-red-500'
                      : 'text-gray-600'
                  }`}>{t('game.question')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show question types horizontally
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-6 relative overflow-hidden bg-gradient-to-br from-[#4d0000] via-[#7a0000] to-[#3d0000]">
      {/* Red Wavy Pattern - Bottom Left */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' stroke-width='0.5' opacity='0.8'%3E%3Cpath d='M10 50 Q 25 30, 40 50 T 70 50 T 100 50'/%3E%3Cpath d='M10 60 Q 25 40, 40 60 T 70 60 T 100 60'/%3E%3Cpath d='M10 70 Q 25 50, 40 70 T 70 70 T 100 70'/%3E%3Cpath d='M10 80 Q 25 60, 40 80 T 70 80 T 100 80'/%3E%3Cpath d='M10 90 Q 25 70, 40 90 T 70 90 T 100 90'/%3E%3Cpath d='M10 40 Q 25 20, 40 40 T 70 40 T 100 40'/%3E%3Cpath d='M10 30 Q 25 10, 40 30 T 70 30 T 100 30'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
          backgroundPosition: '0 0',
        }}
      />

      {/* Dot Pattern - Right Side Fade */}
      <div
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 85% 50%, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 25%, rgba(239, 68, 68, 0.02) 50%, transparent 100%)`,
        }}
      />

      {/* Subtle Dot Grid - Right Side */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.6) 1.5px, transparent 1.5px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0',
        }}
      />

      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-900/50 to-transparent" />
      </div>

      <div className="w-full max-w-6xl relative z-10 pt-8">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => {
              setGame(null);
              setQuestions([]);
              setSelectedType(null);
              setSelectedQuestion(null);
              router.push('/play');
            }}
            className="text-white hover:text-red-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>

        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3">
            {t('game.selectQuestionType')}
          </h1>
          <p className="text-lg md:text-xl text-red-100">
            {t('game.chooseQuestionTypeToStart')}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {questionTypes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-white">
              {t('questions.noQuestions')}
            </div>
          ) : (
            questionTypes.map((type) => {
              // Translate question type names
              const getQuestionTypeName = (name: string) => {
                const typeMap: { [key: string]: string } = {
                  'multiple_choice': t('questions.multipleChoice'),
                  'true_false': t('questions.trueOrFalse'),
                  'short_answer': t('questions.shortAnswer'),
                  'essay': t('questions.essay'),
                  'matching': t('questions.matching'),
                  'sign_screen': t('questions.signScreen'),
                  'general_knowledge': t('questions.generalKnowledge'),
                  'general knowledge': t('questions.generalKnowledge'), // Handle space variant
                };
                return typeMap[name] || name;
              };

              return (
                <div
                  key={type}
                  onClick={async () => {
                    const newClicked = new Set(clickedTypes);
                    newClicked.add(type);
                    setClickedTypes(newClicked);
                    
                    // Special handling for general_knowledge - auto-load first unopened question
                    if (type.toLowerCase().includes('general')) {
                      try {
                        const res = await fetch(
                          `/api/questions/next-unopened?round_id=${game.round_id}&question_type=${encodeURIComponent(type)}`
                        );
                        if (res.ok) {
                          const data = await res.json();
                          if (data.question) {
                            // Found unopened question - display it directly
                            setSelectedQuestion({
                              ...data.question,
                              title: data.question.title || data.question.question_text
                            });
                            setSelectedType(type);
                            setTimeLeft(data.question.time_limit || 30);
                          } else {
                            // No unopened questions - show finished screen but DON'T set selectedType
                            // This prevents showing the question list screen
                            setAnswerResult({
                              correct: true,
                              message: t('game.sessionFinished')
                            });
                            // Don't set selectedType - show finished screen directly
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching unopened question:', error);
                        // Fallback to normal behavior
                        setTimeout(() => setSelectedType(type), 100);
                      }
                    } else {
                      // For other question types, show the list of questions
                      setTimeout(() => setSelectedType(type), 100);
                    }
                  }}
                  className="bg-white rounded-2xl p-8 shadow-2xl cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                >
                  <div className="space-y-6 flex flex-col items-center justify-center">
                    {/* Title */}
                    <h3 className="font-bold text-2xl md:text-3xl text-red-600 group-hover:text-red-700 transition-colors text-center">
                      {getQuestionTypeName(type)}
                    </h3>

                    {/* Count */}
                    <p className="text-xl md:text-2xl font-semibold text-gray-600">
                      ({groupedQuestions[type].length})
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden bg-red-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
