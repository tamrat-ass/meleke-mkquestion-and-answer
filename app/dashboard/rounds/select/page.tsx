'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ChevronRight } from 'lucide-react';

interface Round {
  id: string;
  name: string;
  round_number: number;
  description?: string;
  created_at: string;
}

interface Game {
  id: string;
  title: string;
  round_id: string;
  status: string;
}

export default function SelectRoundPage() {
  const { t } = useLanguage();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [roundGames, setRoundGames] = useState<Game[]>([]);

  useEffect(() => {
    fetchRoundsAndGames();
  }, []);

  const fetchRoundsAndGames = async () => {
    try {
      const [roundsRes, gamesRes] = await Promise.all([
        fetch('/api/rounds'),
        fetch('/api/games'),
      ]);

      if (roundsRes.ok) {
        const roundsData = await roundsRes.json();
        setRounds(roundsData.rounds || []);
      }

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(gamesData.games || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoundSelect = (roundId: string) => {
    setSelectedRound(roundId);
    const gamesForRound = games.filter((g) => g.round_id === roundId);
    setRoundGames(gamesForRound);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">{t('rounds.selectRoundToPlay')}</h2>
        <p className="text-muted-foreground">{t('rounds.chooseRoundAndStart')}</p>
      </div>

      {!selectedRound ? (
        // Show all rounds
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {rounds.length === 0 ? (
            <Card className="border-border/50 bg-card col-span-full">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  {t('rounds.noRoundsAvailable')}
                </div>
              </CardContent>
            </Card>
          ) : (
            rounds.map((round) => {
              const roundGameCount = games.filter((g) => g.round_id === round.id).length;
              return (
                <Card
                  key={round.id}
                  className="border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleRoundSelect(round.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{round.name}</span>
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </CardTitle>
                    <CardDescription>Round #{round.round_number}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {round.description && (
                      <p className="text-sm text-muted-foreground">{round.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">
                        {roundGameCount} {t('games.game')}{roundGameCount !== 1 ? 's' : ''} {t('common.available')}
                      </span>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {t('rounds.select')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        // Show games for selected round
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRound(null);
                setRoundGames([]);
              }}
              className="border-border/50"
            >
              ← {t('common.backToRounds')}
            </Button>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {rounds.find((r) => r.id === selectedRound)?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {roundGames.length} {t('games.game')}{roundGames.length !== 1 ? 's' : ''} {t('common.available')}
              </p>
            </div>
          </div>

          {roundGames.length === 0 ? (
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  {t('games.noGamesAvailableForRound')}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {roundGames.map((game) => (
                <Card key={game.id} className="border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{game.title}</CardTitle>
                    <CardDescription>
                      {t('common.status')}: <span className="capitalize text-primary">{t(`common.${game.status}`)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/app/game/${game.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Play className="h-4 w-4 mr-2" />
                        {t('games.playGame')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
