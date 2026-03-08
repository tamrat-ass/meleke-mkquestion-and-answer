'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Edit2, Play } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface Round {
  id: string;
  name: string;
  round_number: number;
  description?: string;
  created_at: string;
}

export default function RoundsPage() {
  const { t } = useLanguage();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [roundDescription, setRoundDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role_name || '');
    }
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    try {
      const response = await fetch('/api/rounds');
      if (response.ok) {
        const data = await response.json();
        setRounds(data.rounds || []);
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
      setError('Failed to load rounds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!roundName.trim()) {
      setError(t('common.roundNameRequired'));
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roundName.trim(),
          description: roundDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create round');
        return;
      }

      setSuccess(`✓ ${t('common.roundCreated')} "${roundName}" ${t('common.successfully')}!`);
      setRoundName('');
      setRoundDescription('');
      fetchRounds();
    } catch (err) {
      setError(t('common.errorOccurred'));
      console.error('Create round error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRound = async (roundId: string, roundName: string) => {
    if (!confirm(`${t('common.confirm')} "${roundName}"?`)) return;

    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess(`✓ ${t('common.roundDeleted')} "${roundName}" ${t('common.successfully')}!`);
        setRounds(rounds.filter((r) => r.id !== roundId));
      } else {
        const data = await response.json();
        setError(data.error || t('common.failedDelete'));
      }
    } catch (error) {
      console.error('Error deleting round:', error);
      setError(t('common.failedDelete'));
    }
  };

  const isPlayer = userRole === 'player';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('rounds.rounds')}</h2>
          <p className="text-muted-foreground">
            {isPlayer ? t('play.selectGame') : t('rounds.manageRounds')}
          </p>
        </div>
        {isPlayer && (
          <Link href="/dashboard/rounds/select">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Play className="mr-2 h-4 w-4" />
              {t('play.playNow')}
            </Button>
          </Link>
        )}
      </div>

      {!isPlayer && (
        <>
          {/* Create Round Form */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle>{t('rounds.newRound')}</CardTitle>
              <CardDescription>{t('common.addNew')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRound} className="space-y-4">
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
                    disabled={isCreating}
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('common.description')}</label>
                  <Input
                    placeholder={t('common.descriptionPlaceholder')}
                    value={roundDescription}
                    onChange={(e) => setRoundDescription(e.target.value)}
                    disabled={isCreating}
                    className="bg-input border-border/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? t('common.creating') : t('rounds.newRound')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* Rounds List */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('rounds.rounds')} ({rounds.length})</CardTitle>
          <CardDescription>
            {isPlayer ? t('play.availableGames') : t('rounds.manageRounds')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isPlayer ? t('play.noGamesAvailable') : t('rounds.noRounds')}
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="border border-border/30 rounded-lg p-4 hover:border-primary/30 hover:bg-secondary/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {round.name}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({t('rounds.roundNumber')} #{round.round_number})
                        </span>
                      </h3>
                      {round.description && (
                        <p className="text-sm text-muted-foreground mt-1">{round.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('common.created')}: {new Date(round.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {isPlayer ? (
                        <Link href={`/dashboard/rounds/select?roundId=${round.id}`}>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {t('play.playNow')}
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link href={`/dashboard/rounds/${round.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border/50 bg-transparent"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteRound(round.id, round.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isPlayer && (
        <>
          {/* Quick Links */}
          {/* <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>What to do after creating rounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-primary font-semibold">1.</div>
                <div>
                  <p className="font-medium text-foreground">Upload Questions</p>
                  <p className="text-sm text-muted-foreground">
                    Go to{' '}
                    <Link href="/dashboard/questions/upload" className="text-primary hover:underline">
                      Questions Upload
                    </Link>{' '}
                    to add questions to your rounds
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-primary font-semibold">2.</div>
                <div>
                  <p className="font-medium text-foreground">Create Games</p>
                  <p className="text-sm text-muted-foreground">
                    Go to{' '}
                    <Link href="/dashboard/games" className="text-primary hover:underline">
                      Games
                    </Link>{' '}
                    to create games for your rounds
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-primary font-semibold">3.</div>
                <div>
                  <p className="font-medium text-foreground">Start Playing</p>
                  <p className="text-sm text-muted-foreground">
                    Start a game and begin playing with your questions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </>
      )}
    </div>
  );
}
