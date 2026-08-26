'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export default function CreateGamePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedRound, setSelectedRound] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [group1Name, setGroup1Name] = useState('Team 1');
  const [group2Name, setGroup2Name] = useState('Team 2');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRounds();
  }, []);

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
      setError(t('common.failedLoad'));
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRound) {
      setError(t('common.selectRound'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: gameTitle.trim() || undefined,
          description: gameDescription.trim() || undefined,
          round_id: selectedRound,
          groups: [
            { name: group1Name.trim() || t('games.teamName') + ' 1' },
            { name: group2Name.trim() || t('games.teamName') + ' 2' },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('common.failedCreate'));
        setIsLoading(false);
        return;
      }

      router.push('/dashboard/games');
    } catch (err) {
      setError(t('common.errorOccurred'));
      console.error('Create game error:', err);
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('games.newGame')}</h2>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('games.newGame')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('games.setupGame')}</p>
        </div>
        <Link href="/dashboard/games">
          <Button variant="outline" className="border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      {/* Form Card */}
      <Card className="border-border/50 bg-card shadow-lg max-w-2xl">
        <CardHeader className="pb-4 border-b border-border/20">
          <CardTitle className="text-xl">{t('games.gameDetails')}</CardTitle>
          <CardDescription>{t('games.createGameDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive font-medium">
                {error}
              </div>
            )}

            {rounds.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-600 font-medium">
                {t('games.noRounds')} 
                <Link href="/dashboard/rounds" className="underline ml-1 hover:text-yellow-700 transition">
                  {t('games.createRound')}
                </Link>
              </div>
            ) : (
              <>
                {/* Round Selection */}
                <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/30">
                  <label className="text-sm font-bold text-foreground block">{t('games.selectRound')} *</label>
                  <Select value={selectedRound} onValueChange={setSelectedRound}>
                    <SelectTrigger className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11">
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

                {/* Game Title */}
                <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/30">
                  <label className="text-sm font-bold text-foreground block">{t('games.gameTitle')}</label>
                  <Input
                    placeholder={t('games.gameTitlePlaceholder')}
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11 text-base"
                    disabled={isLoading}
                  />
                </div>

                {/* Description */}
                <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/30">
                  <label className="text-sm font-bold text-foreground block">{t('common.description')}</label>
                  <Input
                    placeholder={t('common.descriptionPlaceholder')}
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11 text-base"
                    disabled={isLoading}
                  />
                </div>

                {/* Teams Section */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-foreground block px-4 py-2">{t('games.teams')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team 1 */}
                    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 border border-blue-200/50 dark:border-blue-800/50">
                      <label className="text-xs font-bold text-foreground block">{t('games.teamName')} 1</label>
                      <Input
                        value={group1Name}
                        onChange={(e) => setGroup1Name(e.target.value)}
                        placeholder={t('games.teamName')}
                        className="bg-white dark:bg-card border-blue-300/50 dark:border-border/50 focus:border-blue-500 transition-colors h-10 text-base"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Team 2 */}
                    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/20 dark:to-red-950/10 border border-red-200/50 dark:border-red-800/50">
                      <label className="text-xs font-bold text-foreground block">{t('games.teamName')} 2</label>
                      <Input
                        value={group2Name}
                        onChange={(e) => setGroup2Name(e.target.value)}
                        placeholder={t('games.teamName')}
                        className="bg-white dark:bg-card border-red-300/50 dark:border-border/50 focus:border-red-500 transition-colors h-10 text-base"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border/20">
                  <Link href="/dashboard/games" className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all" 
                      disabled={isLoading}
                    >
                      {t('common.cancel')}
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all font-semibold py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? t('common.creating') : t('games.newGame')}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
