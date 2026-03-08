'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
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

interface Round {
  id: string;
  name: string;
  round_number: number;
}

interface GameGroup {
  id: string;
  name: string;
}

interface Game {
  id: string;
  title: string;
  status: string;
  round_id: string;
  round_name: string;
}

export default function EditGamePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [rounds, setRounds] = useState<Round[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [groups, setGroups] = useState<GameGroup[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedRound, setSelectedRound] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [group1Name, setGroup1Name] = useState('Team 1');
  const [group2Name, setGroup2Name] = useState('Team 2');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoundsAndGame();
  }, [gameId]);

  const fetchRoundsAndGame = async () => {
    try {
      const [roundsRes, gameRes] = await Promise.all([
        fetch('/api/rounds'),
        fetch(`/api/games/${gameId}`),
      ]);

      if (roundsRes.ok) {
        const data = await roundsRes.json();
        setRounds(data.rounds || []);
      }

      if (gameRes.ok) {
        const data = await gameRes.json();
        setGame(data.game);
        setGroups(data.groups || []);
        setGameTitle(data.game.title);
        setSelectedRound(data.game.round_id || '');
        if (data.groups && data.groups.length >= 2) {
          setGroup1Name(data.groups[0].name);
          setGroup2Name(data.groups[1].name);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load game data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRound) {
      setError(t('games.selectRoundRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: gameTitle.trim() || 'Game',
          round_id: selectedRound,
          groups: [
            { name: group1Name.trim() || 'Team 1' },
            { name: group2Name.trim() || 'Team 2' },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('common.error'));
        setIsLoading(false);
        return;
      }

      router.push('/dashboard/games');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Update game error:', err);
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('common.edit')} {t('games.game')}</h2>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('common.edit')} {t('games.game')}</h2>
          <p className="text-muted-foreground">{t('games.gameNotFound')}</p>
        </div>
        <Link href="/dashboard/games">
          <Button variant="outline" className="border-border/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('games.backToGames')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('common.edit')} {t('games.game')}</h2>
          <p className="text-muted-foreground">{t('games.updateGameDetails')}</p>
        </div>
        <Link href="/dashboard/games">
          <Button variant="outline" className="border-border/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 bg-card max-w-2xl">
        <CardHeader>
          <CardTitle>{t('games.gameDetails')}</CardTitle>
          <CardDescription>{t('games.updateGameConfig')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('games.selectRound')} *</label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue placeholder={t('games.selectRoundPlaceholder')} />
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
              <label className="text-sm font-medium text-foreground">{t('games.gameTitle')}</label>
              <Input
                placeholder={t('games.gameTitlePlaceholder')}
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="bg-input border-border/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">{t('games.teams')}</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('games.team')} 1 {t('common.name')}</label>
                  <Input
                    value={group1Name}
                    onChange={(e) => setGroup1Name(e.target.value)}
                    placeholder={`${t('games.team')} 1`}
                    className="bg-input border-border/50"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('games.team')} 2 {t('common.name')}</label>
                  <Input
                    value={group2Name}
                    onChange={(e) => setGroup2Name(e.target.value)}
                    placeholder={`${t('games.team')} 2`}
                    className="bg-input border-border/50"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/games" className="flex-1">
                <Button variant="outline" className="w-full border-border/50" disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? t('common.updating') : t('games.updateGame')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
