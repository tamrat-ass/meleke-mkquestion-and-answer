'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  time_limit: number;
  marks: number;
  question_type: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  options: Array<{ option_key: string; option_value: string }>;
}

export default function EditQuestionPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    question_text: '',
    correct_answer: '',
    time_limit: 30,
    marks: 1,
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
  });

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/questions/${questionId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Question data:', data.question); // Debug log
        setQuestion(data.question);
        setFormData({
          question_text: data.question.question_text,
          correct_answer: data.question.correct_answer,
          time_limit: data.question.time_limit,
          marks: data.question.marks,
          option_a: data.question.option_a || '',
          option_b: data.question.option_b || '',
          option_c: data.question.option_c || '',
          option_d: data.question.option_d || '',
        });
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/questions');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      setError('An error occurred while saving the question');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (!question) {
    return <div className="text-center py-8">{t('questions.questionNotFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('common.edit')} {t('questions.question')}</h2>
          <p className="text-muted-foreground">{t('questions.updateQuestionDetails')}</p>
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
          <CardTitle>{t('questions.questionDetails')}</CardTitle>
          <CardDescription>{t('questions.editQuestionText')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-600">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-600">
              {t('common.configurationSaved')}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('questions.questionText')}</label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              className="w-full p-3 rounded border border-border/50 bg-input text-foreground min-h-24"
              placeholder={t('questions.enterQuestionText')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('questions.correctAnswer')}</label>
            <textarea
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              placeholder={t('questions.correctAnswerPlaceholder')}
              className="w-full p-3 rounded border border-border/50 bg-input text-foreground min-h-32"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('questions.timeLimit')} ({t('questions.seconds')})</label>
              <Input
                type="number"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                className="bg-input border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('questions.marks')}</label>
              <Input
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                className="bg-input border-border/50"
              />
            </div>
          </div>

          {question?.question_type === 'multiple_choice' && (
            <div className="space-y-4 border-t border-border/30 pt-4">
              <h3 className="text-sm font-bold">{t('questions.answerOptions')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('game.labelA')}</label>
                  <textarea
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    placeholder="Option A text"
                    className="w-full p-3 rounded border border-border/50 bg-input text-foreground min-h-20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('game.labelB')}</label>
                  <textarea
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    placeholder="Option B text"
                    className="w-full p-3 rounded border border-border/50 bg-input text-foreground min-h-20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('game.labelC')}</label>
                  <textarea
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    placeholder="Option C text"
                    className="w-full p-3 rounded border border-border/50 bg-input text-foreground min-h-20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('game.labelD')}</label>
                  <textarea
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    placeholder="Option D text"
                    className="w-full p-3 rounded border border-border/50 bg-input text-foreground min-h-20"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {question && (
        <Card className="border-border/50 bg-card shadow-lg">
          <CardHeader className="pb-4 border-b border-border/20">
            <CardTitle>{t('questions.answerOptions')}</CardTitle>
            <CardDescription>{t('questions.currentOptions')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {question.options && question.options.length > 0 ? (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <div
                    key={option.option_key}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      option.option_key === formData.correct_answer
                        ? 'border-green-500/70 bg-green-500/15'
                        : 'border-border/30 bg-secondary/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-foreground">{option.option_key}.</span>
                        <span className="text-foreground">{option.option_value}</span>
                      </div>
                      {option.option_key === formData.correct_answer && (
                        <span className="text-xs font-bold bg-green-500/20 text-green-600 px-3 py-1 rounded-full">
                          ✓ {t('questions.correct')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('questions.noOptionsAvailable')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? t('common.saving') : t('questions.saveChanges')}
        </Button>
        <Link href="/dashboard/questions">
          <Button variant="outline" className="border-border/50">
            {t('common.cancel')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
