'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

interface QuestionOption {
  option_key: string;
  option_value: string;
}

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  time_limit: number;
  marks: number;
  options: QuestionOption[];
}

interface Round {
  id: string;
  name: string;
  round_number: number;
}

export default function ViewQuestionsPage() {
  const { t } = useLanguage();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRounds();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      fetchQuestions(selectedRound);
    }
  }, [selectedRound]);

  const fetchRounds = async () => {
    try {
      const response = await fetch('/api/rounds');
      if (response.ok) {
        const data = await response.json();
        setRounds(data.rounds || []);
        if (data.rounds && data.rounds.length > 0) {
          setSelectedRound(data.rounds[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (roundId: string) => {
    try {
      const response = await fetch(`/api/questions/by-round/${roundId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const selectedRoundName = rounds.find(r => r.id === selectedRound)?.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('questions.viewQuestionsByRound')}</h2>
          <p className="text-muted-foreground">{t('questions.viewAllQuestionsWithOptions')}</p>
        </div>
        <Link href="/dashboard/questions">
          <Button variant="outline" className="border-border/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('rounds.selectRound')}</CardTitle>
          <CardDescription>{t('questions.chooseRoundToViewQuestions')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">{t('common.loading')}</div>
          ) : rounds.length === 0 ? (
            <div className="text-muted-foreground">{t('rounds.noRoundsFound')}</div>
          ) : (
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-full bg-input border-border/50">
                <SelectValue placeholder={t('rounds.selectRoundPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name} ({t('rounds.roundNumber')} #{round.round_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedRound && (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('questions.questionsIn')} {selectedRoundName}</CardTitle>
            <CardDescription>{t('common.total')}: {questions.length} {t('questions.questions')}</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('questions.noQuestionsInRound')}
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-4 rounded border border-border/20 bg-secondary/10"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-foreground mb-2">
                        {t('questions.question')} {index + 1}
                      </h3>
                      <p className="text-foreground mb-2">{question.question_text}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{t('questions.time')}: {question.time_limit}s</span>
                        <span>{t('questions.marks')}: {question.marks}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-muted-foreground">{t('questions.options')}:</p>
                      {question.options && question.options.length > 0 ? (
                        question.options.map((option) => (
                          <div
                            key={option.option_key}
                            className={`p-3 rounded border ${
                              option.option_key === question.correct_answer
                                ? 'border-green-500/50 bg-green-500/10'
                                : 'border-border/30 bg-secondary/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {option.option_key}.
                              </span>
                              <span className="text-foreground">
                                {option.option_value}
                              </span>
                              {option.option_key === question.correct_answer && (
                                <span className="ml-auto text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded">
                                  ✓ {t('questions.correctAnswer')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('questions.noOptionsAvailable')}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/20">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{t('questions.correctAnswer')}: </span>
                        <span className="font-semibold text-green-600">
                          {question.correct_answer}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
