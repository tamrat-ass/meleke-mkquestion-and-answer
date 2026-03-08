'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';

interface Round {
  id: string;
  name: string;
  round_number: number;
  description?: string;
  created_at: string;
}

export default function EditRoundPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;

  const [round, setRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [roundDescription, setRoundDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRound();
  }, [roundId]);

  const fetchRound = async () => {
    try {
      const response = await fetch(`/api/rounds/${roundId}`);
      if (response.ok) {
        const data = await response.json();
        setRound(data.round);
        setRoundName(data.round.name);
        setRoundDescription(data.round.description || '');
      } else {
        setError('Round not found');
      }
    } catch (error) {
      console.error('Error fetching round:', error);
      setError('Failed to load round');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!roundName.trim()) {
      setError(t('rounds.roundNameRequired'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roundName.trim(),
          description: roundDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('common.error'));
        return;
      }

      setSuccess('✓ ' + t('rounds.roundUpdated'));
      setTimeout(() => {
        router.push('/dashboard/rounds');
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Update round error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-destructive">{t('rounds.roundNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/rounds')}
          className="border-border/50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('common.edit')} {t('rounds.round')}</h2>
          <p className="text-muted-foreground">{t('rounds.updateRoundDetails')}</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card max-w-2xl">
        <CardHeader>
          <CardTitle>{t('rounds.roundNumber')} #{round.round_number}</CardTitle>
          <CardDescription>
            {t('common.created')}: {new Date(round.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateRound} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-600">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('rounds.roundName')} *</label>
              <Input
                placeholder={t('rounds.roundNamePlaceholder')}
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                disabled={isSaving}
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('rounds.description')} ({t('common.optional')})</label>
              <Input
                placeholder={t('rounds.descriptionPlaceholder')}
                value={roundDescription}
                onChange={(e) => setRoundDescription(e.target.value)}
                disabled={isSaving}
                className="bg-input border-border/50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? t('common.saving') : t('common.saveChanges')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/rounds')}
                disabled={isSaving}
                className="border-border/50"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
