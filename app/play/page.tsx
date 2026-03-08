'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, Home, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
interface Game {
  id: string;
  name: string;
  status: string;
  created_at: string;
  round_id: string;
  round_name: string;
  round_number: number;
}

export default function PlayPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    fetchGames();

    // Auto-refresh games every 5 seconds
    const interval = setInterval(() => {
      fetchGames();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        // Show all games (both active and draft)
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGames();
  };

  const handlePlayGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t('play.availableGames')}</h1>
            <p className="text-muted-foreground">{t('play.selectGame')}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-border/50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? t('common.refreshing') : t('common.refresh')}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-border/50"
            >
              <Home className="h-4 w-4 mr-2" />
              {t('sidebar.overview')}
            </Button>
          </div>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground text-lg mb-4">{t('play.noGamesAvailable')}</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-primary hover:bg-primary/90"
              >
                {t('play.goToDashboard')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Card
                key={game.id}
                className="border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                        {game.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {t('play.round')}: {game.round_name}
                      </CardDescription>
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-green-500/20 text-green-600 rounded-full">
                      {t(`common.${game.status}`)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>{t('common.created')}: {new Date(game.created_at).toLocaleDateString()}</p>
                  </div>

                  <Button
                    onClick={() => handlePlayGame(game.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group/btn"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('play.playNow')}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}