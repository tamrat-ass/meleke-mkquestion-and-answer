'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

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

  const getAnswerDisplay = (question: Question) => {
    if (question.question_type === 'short_answer') {
      return question.correct_answer;
    }
    // For multiple choice, show "A. option text"
    const answerLetter = String(question.correct_answer).toUpperCase();
    const optionText = 
      answerLetter === 'A' ? question.option_a :
      answerLetter === 'B' ? question.option_b :
      answerLetter === 'C' ? question.option_c :
      answerLetter === 'D' ? question.option_d :
      '';
    return `${answerLetter}. ${optionText}`;
  };

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

  useEffect(() => {
    if (!timerActive || timeLeft < 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Play sound when minimum time frame is reached
        if (newTime === (selectedQuestion?.minimum_time_frame || 5)) {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              console.error('Audio playback failed:', error);
            });
          }
        }

        // When time is up
        if (newTime <= 0) {
          setTimerActive(false);
          // If no answer was selected, show answer after 3 seconds
          if (!answerResult) {
            setTimeout(() => {
              setAnswerResult({
                correct: true,
                message: '✓ Time\'s Up!'
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
  }, [timerActive, selectedQuestion]);

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

  const questionTypes = Object.keys(groupedQuestions);
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

  // Show question detail view
  if (selectedQuestion) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background relative">
        {/* Logo in top right - clickable to start timer */}
        <button
          onClick={() => {
            if (!timerActive) {
              const timeLimit = selectedQuestion?.time_limit || 30;
              setTimeLeft(timeLimit);
              setTimerActive(true);
            }
          }}
          className="absolute top-6 right-32 hover:opacity-80 transition-opacity"
        >
          <img src="/images/logo.jpg" alt="Logo" className="h-24 w-auto cursor-pointer" />
        </button>

        {/* mk.png on top left - clickable back button */}
        <button
          onClick={() => {
            setTimerActive(false);
            setSelectedQuestion(null);
            setShowAnswer(false);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setTimeLeft(0);
          }}
          className="absolute left-24 top-6 hover:opacity-80 transition-opacity"
        >
          <img src="/images/mk.png" alt="MK" className="h-20 w-auto cursor-pointer" />
        </button>

        <Card className="w-full max-w-4xl border-2 border-border/50 bg-card shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex justify-between items-start">
              <CardTitle className="text-4xl">
                {selectedQuestionIndex + 1}. {selectedQuestion.title}
              </CardTitle>
              {timerActive && timeLeft > 0 && !answerResult ? (
                <div className={`text-sm font-bold px-3 py-1 rounded ${
                  timerActive && timeLeft <= (selectedQuestion?.minimum_time_frame || 5)
                    ? 'bg-red-500/20 text-red-600'
                    : 'bg-secondary/50 text-muted-foreground'
                }`}>
                  ⏱ 00:{String(timeLeft).padStart(2, '0')}
                </div>
              ) : null}
            </div>
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
      };
      return typeMap[name] || name;
    };

    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-start p-6 bg-background">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedType(null);
            setClickedQuestions(new Set());
          }}
          className="border-border/50 absolute top-6 left-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        {/* Main Title for Questions List */}
        <div className="w-full max-w-6xl mb-12 text-center mt-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            {getQuestionTypeName(selectedType)}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('game.selectQuestion')}
          </p>
        </div>

        <div className="grid gap-6 grid-cols-4 auto-rows-fr w-full max-w-6xl">
          {selectedTypeQuestions.map((question, index) => (
            <div
              key={question.id}
              onClick={() => {
                const newClicked = new Set(clickedQuestions);
                newClicked.add(question.id);
                setClickedQuestions(newClicked);
                // Store the question index
                const index = selectedTypeQuestions.indexOf(question);
                setSelectedQuestionIndex(index);
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
              className={`group relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer p-6 flex items-center justify-center min-h-40 ${
                clickedQuestions.has(question.id)
                  ? 'border-red-500/80 bg-gradient-to-br from-red-950/30 to-red-900/20 hover:shadow-xl hover:shadow-red-500/20'
                  : 'border-border/30 bg-gradient-to-br from-card to-secondary/10 hover:border-primary/50 hover:shadow-lg'
              }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                clickedQuestions.has(question.id)
                  ? 'bg-gradient-to-br from-red-500/10 to-transparent'
                  : 'bg-gradient-to-br from-primary/5 to-transparent'
              }`} />
              <div className="relative z-10 text-center">
                <div className={`text-5xl font-bold transition-colors ${
                  clickedQuestions.has(question.id)
                    ? 'text-red-400 group-hover:text-red-300'
                    : 'text-primary group-hover:text-primary/80'
                }`}>
                  {index + 1}
                </div>
                <p className={`text-sm mt-2 ${
                  clickedQuestions.has(question.id)
                    ? 'text-red-300/70'
                    : 'text-muted-foreground'
                }`}>{t('game.question')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show question types horizontally
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background">
      {/* Main Title */}
      <div className="w-full max-w-4xl mb-12 text-center px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">{t('game.selectQuestionType')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">{t('game.chooseQuestionTypeToStart')}</p>
      </div>

      <div className="w-full flex justify-center">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 max-w-4xl">
          {questionTypes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
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
                };
                return typeMap[name] || name;
              };

              return (
                <div
                  key={type}
                  onClick={() => {
                    const newClicked = new Set(clickedTypes);
                    newClicked.add(type);
                    setClickedTypes(newClicked);
                    // Delay navigation to allow state to update
                    setTimeout(() => setSelectedType(type), 100);
                  }}
                  className={`w-full group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer min-h-40 sm:min-h-48 p-4 sm:p-6 md:p-8 ${
                    clickedTypes.has(type)
                      ? 'border-red-500/80 bg-gradient-to-br from-red-950/30 to-red-900/20 hover:shadow-xl hover:shadow-red-500/20'
                      : 'border-border/30 bg-gradient-to-br from-card to-secondary/10 hover:border-primary/50 hover:shadow-xl'
                  }`}
                >
                  {/* Background accent */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    clickedTypes.has(type)
                      ? 'bg-gradient-to-br from-red-500/10 to-transparent'
                      : 'bg-gradient-to-br from-primary/5 to-transparent'
                  }`} />
                  
                  <div className="relative z-10 space-y-6 h-full flex flex-col justify-center items-center">
                    {/* Icon and title */}
                    <div className="text-center px-2">
                      <h3 className={`font-bold text-lg sm:text-xl md:text-2xl transition-colors line-clamp-2 ${
                        clickedTypes.has(type)
                          ? 'text-red-400 group-hover:text-red-300'
                          : 'text-foreground group-hover:text-primary'
                      }`}>
                        {getQuestionTypeName(type)}
                      </h3>
                      <p className={`text-sm sm:text-base md:text-lg mt-2 font-semibold ${
                        clickedTypes.has(type)
                          ? 'text-red-300/70'
                          : 'text-muted-foreground'
                      }`}>
                        ({groupedQuestions[type].length})
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      clickedTypes.has(type)
                        ? 'bg-red-900/30'
                        : 'bg-secondary/30'
                    }`}>
                      <div className={`h-full rounded-full ${
                        clickedTypes.has(type)
                          ? 'bg-gradient-to-r from-red-500 to-red-400'
                          : 'bg-gradient-to-r from-primary to-primary/60'
                      }`} />
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
