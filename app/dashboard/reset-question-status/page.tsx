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
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface Round {
  id: string;
  name: string;
  round_number: number;
}

interface Question {
  id: string;
  title: string;
  question_type: string;
  status: string;
  round_id: string;
}

export default function ResetQuestionStatusPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [formData, setFormData] = useState({
    resetType: 'round', // 'round' or 'question'
    round_id: '',
    question_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const roundsRes = await fetch('/api/rounds');
      if (roundsRes.ok) {
        const data = await roundsRes.json();
        setRounds(data.rounds || []);
        if (data.rounds && data.rounds.length > 0) {
          setFormData(prev => ({ ...prev, round_id: data.rounds[0].id }));
          fetchQuestions(data.rounds[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('common.failedLoad'));
    } finally {
      setIsFetching(false);
    }
  };

  const fetchQuestions = async (roundId: string) => {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        const openedQuestions = (data.questions || []).filter(
          (q: Question) => q.round_id === roundId && q.status === 'OPENED'
        );
        setQuestions(openedQuestions);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'round_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
      fetchQuestions(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (formData.resetType === 'round' && !formData.round_id) {
        setError(t('common.selectRound'));
        setIsLoading(false);
        return;
      }

      if (formData.resetType === 'question' && !formData.question_id) {
        setError(t('resetQuestionStatus.pleaseSelectQuestion'));
        setIsLoading(false);
        return;
      }

      const body = formData.resetType === 'round'
        ? { round_id: formData.round_id }
        : { question_id: formData.question_id };

      // Get user from localStorage to send in header
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user?.id) {
        setError(t('resetQuestionStatus.userNotFound'));
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/admin/reset-question-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('resetQuestionStatus.failedReset'));
        setIsLoading(false);
        return;
      }

      if (formData.resetType === 'round') {
        setSuccess(`✓ ${data.message} (${data.questions_count} ${t('resetQuestionStatus.successRound')})`);
        // Refresh questions
        fetchQuestions(formData.round_id);
      } else {
        setSuccess(`✓ ${t('resetQuestionStatus.success')}`);
        // Refresh questions
        fetchQuestions(formData.round_id);
      }

      // Clear form
      setFormData({
        resetType: 'round',
        round_id: formData.round_id,
        question_id: '',
      });
    } catch (err) {
      setError(t('common.errorOccurred'));
      console.error('Reset status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('resetQuestionStatus.title')}</h2>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('resetQuestionStatus.title')}</h2>
          <p className="text-muted-foreground">{t('resetQuestionStatus.subtitle')}</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="border-border/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reset Type Selection */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('resetQuestionStatus.resetType')}</CardTitle>
            <CardDescription>{t('resetQuestionStatus.chooseReset')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Reset by Round */}
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="resetType"
                  value="round"
                  checked={formData.resetType === 'round'}
                  onChange={(e) => setFormData(prev => ({ ...prev, resetType: e.target.value }))}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold text-foreground">{t('resetQuestionStatus.resetAllInRound')}</p>
                  <p className="text-sm text-muted-foreground">{t('resetQuestionStatus.resetAllInRoundDesc')}</p>
                </div>
              </label>

              {/* Reset by Question */}
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="resetType"
                  value="question"
                  checked={formData.resetType === 'question'}
                  onChange={(e) => setFormData(prev => ({ ...prev, resetType: e.target.value }))}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold text-foreground">{t('resetQuestionStatus.resetSingleQuestion')}</p>
                  <p className="text-sm text-muted-foreground">{t('resetQuestionStatus.resetSingleQuestionDesc')}</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Round Selection */}
        {formData.resetType === 'round' && (
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle>{t('resetQuestionStatus.selectRound')}</CardTitle>
              <CardDescription>{t('resetQuestionStatus.chooseRound')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('resetQuestionStatus.round')} *</label>
                <Select value={formData.round_id} onValueChange={(value) => handleSelectChange('round_id', value)}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder={t('common.selectRound')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} (Round {round.round_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Selection */}
        {formData.resetType === 'question' && (
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle>{t('resetQuestionStatus.selectQuestion')}</CardTitle>
              <CardDescription>{t('resetQuestionStatus.chooseQuestion')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('resetQuestionStatus.round')} *</label>
                <Select value={formData.round_id} onValueChange={(value) => handleSelectChange('round_id', value)}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder={t('common.selectRound')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} (Round {round.round_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('resetQuestionStatus.question')} *</label>
                <Select value={formData.question_id} onValueChange={(value) => handleSelectChange('question_id', value)}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder={t('resetQuestionStatus.selectQuestionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {questions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t('resetQuestionStatus.noOpenedQuestions')}
                      </div>
                    ) : (
                      questions.map((question) => (
                        <SelectItem key={question.id} value={question.id}>
                          {question.title.substring(0, 50)}...
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {questions.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">
                    📊 {questions.length} {t('resetQuestionStatus.openedCount')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-blue-700 font-semibold">ℹ️ {t('resetQuestionStatus.howItWorks')}</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {t('resetQuestionStatus.onlyResets')}</li>
                <li>• {t('resetQuestionStatus.changesStatus')}</li>
                <li>• {t('resetQuestionStatus.onlyApplies')}</li>
                <li>• {t('resetQuestionStatus.actionLogged')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-700 p-4 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Link href="/dashboard">
            <Button type="button" variant="outline" disabled={isLoading} className="border-border/50">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <RotateCcw className="mr-2 h-4 w-4" />
            {isLoading ? t('resetQuestionStatus.resetting') : t('resetQuestionStatus.resetButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
