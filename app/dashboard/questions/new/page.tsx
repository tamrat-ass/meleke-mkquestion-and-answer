'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface Round {
  id: string;
  name: string;
  round_number: number;
}

interface QuestionType {
  id: string;
  name: string;
}

export default function NewQuestionPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  
  const [formData, setFormData] = useState({
    question_text: '',
    round_id: '',
    question_type: 'choose',
    correct_answer: '',
    time_limit: '30',
    marks: '1',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roundsRes, typesRes] = await Promise.all([
        fetch('/api/rounds'),
        fetch('/api/question-types'),
      ]);

      if (roundsRes.ok) {
        const data = await roundsRes.json();
        setRounds(data.rounds || []);
        if (data.rounds && data.rounds.length > 0) {
          setFormData(prev => ({ ...prev, round_id: data.rounds[0].id }));
        }
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        setQuestionTypes(data.types || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('common.failedLoad'));
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.question_text.trim()) {
        setError(t('common.questionRequired'));
        setIsLoading(false);
        return;
      }

      if (!formData.round_id) {
        setError(t('common.selectRound'));
        setIsLoading(false);
        return;
      }

      if (!formData.correct_answer) {
        setError(t('common.answerRequired'));
        setIsLoading(false);
        return;
      }

      // For multiple choice, validate options
      if (formData.question_type === 'choose') {
        if (!formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
          setError(t('common.allOptionsRequired'));
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: formData.question_text,
          round_id: formData.round_id,
          question_type: formData.question_type,
          correct_answer: formData.correct_answer,
          time_limit: parseInt(formData.time_limit),
          marks: parseInt(formData.marks),
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('common.failedCreate'));
        setIsLoading(false);
        return;
      }

      router.push('/dashboard/questions');
    } catch (err) {
      setError(t('common.errorOccurred'));
      console.error('Create question error:', err);
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('questions.newQuestion')}</h2>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('questions.newQuestion')}</h2>
          <p className="text-muted-foreground">{t('questions.addNew')}</p>
        </div>
        <Link href="/dashboard/questions">
          <Button variant="outline" className="border-border/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Details */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('questions.questionText')}</CardTitle>
            <CardDescription>{t('questions.enterQuestion')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('questions.questionText')} *</label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleInputChange}
                placeholder={t('questions.enterQuestion')}
                disabled={isLoading}
                rows={4}
                className="w-full px-3 py-2 rounded border border-border/50 bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('questions.round')} *</label>
                <Select value={formData.round_id} onValueChange={(value) => handleSelectChange('round_id', value)}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder={t('common.selectRound')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} ({t('rounds.roundNumber')} {round.round_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('questions.questionType')} *</label>
                <Select value={formData.question_type} onValueChange={(value) => handleSelectChange('question_type', value)}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder={t('questions.selectType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="choose">{t('questions.multipleChoice')}</SelectItem>
                    <SelectItem value="short_answer">{t('questions.shortAnswer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('questions.correctAnswer')} *</label>
                <Input
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleInputChange}
                  placeholder={formData.question_type === 'choose' ? 'A, B, C, or D' : t('questions.enterAnswer')}
                  disabled={isLoading}
                  className="bg-input border-border/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('questions.timeLimit')} ({t('questions.seconds')})</label>
                <Input
                  type="number"
                  name="time_limit"
                  value={formData.time_limit}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-input border-border/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('questions.marks')}</label>
                <Input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-input border-border/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Options - Only for Multiple Choice */}
        {formData.question_type === 'choose' && (
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle>{t('questions.answerOptions')}</CardTitle>
              <CardDescription>{t('questions.enter4Options')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const optionKey = `option${letter}Placeholder` as const;
                const labelKey = `option${letter}` as const;
                return (
                  <div key={letter} className="space-y-2">
                    <label className="text-sm font-medium">{t(`game.${labelKey}`)} *</label>
                    <Input
                      name={`option${letter}`}
                      value={formData[`option${letter}` as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={t(`game.${optionKey}`)}
                      disabled={isLoading}
                      className="bg-input border-border/50"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Link href="/dashboard/questions">
            <Button type="button" variant="outline" disabled={isLoading} className="border-border/50">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? t('common.creating') : t('questions.newQuestion')}
          </Button>
        </div>
      </form>
    </div>
  );
}
