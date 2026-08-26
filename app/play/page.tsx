'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, Home, RefreshCw, Calendar } from 'lucide-react';
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

  const handlePlayGame = async (gameId: string) => {
    try {
      // First, activate the game (set status to active)
      const updateResponse = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to activate game');
      }

      // Then navigate to play the game
      router.push(`/game/${gameId}`);
      
      // After navigation, refresh games to see updated status
      setTimeout(() => {
        fetchGames();
      }, 1000);
    } catch (error) {
      console.error('Error playing game:', error);
      // Still navigate even if there's an error
      router.push(`/game/${gameId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[180px]" />
      </div>

      {/* Floating Particles */}
      <div className="absolute top-20 left-20 w-3 h-3 rounded-full bg-primary animate-pulse opacity-60" />
      <div className="absolute top-32 right-24 w-4 h-4 rounded-full bg-primary animate-pulse opacity-50" />
      <div className="absolute bottom-40 left-1/4 w-3 h-3 rounded-full bg-primary animate-ping opacity-50" />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-primary animate-pulse opacity-40" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-2">
                {t('play.availableGames')}
              </h1>
              <p className="text-muted-foreground text-lg">{t('play.selectGame')}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-border/50 bg-card hover:bg-muted hover:border-primary/50 text-foreground hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('common.refreshing') : t('common.refresh')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-border/50 bg-card hover:bg-muted hover:border-primary/50 text-foreground hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('sidebar.overview')}
              </Button>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Card className="border-border/50 bg-card shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="pt-16 pb-16 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                  <Play className="h-10 w-10 text-primary" />
                </div>
              </div>
              <p className="text-foreground text-xl font-medium mb-2">{t('play.noGamesAvailable')}</p>
              <p className="text-muted-foreground text-sm mb-6">Check back soon for new games!</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300"
              >
                {t('play.goToDashboard')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game, index) => (
              <div
                key={game.id}
                className="group"
                style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s both` }}
              >
                <style>{`
                  @keyframes slideUp {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                <Card className="border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col relative">
                  {/* Gradient background accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-foreground group-hover:text-primary transition-colors duration-300">
                          {game.name}
                        </CardTitle>
                        <CardDescription className="mt-3 text-muted-foreground font-medium flex items-center gap-2">
                          <Play className="h-4 w-4 text-primary" />
                          {t('play.round')}: <span className="text-foreground">{game.round_name}</span>
                        </CardDescription>
                      </div>
                      <span className="inline-block px-4 py-2 text-xs font-bold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-md">
                        {t(`common.${game.status}`)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 relative z-10 flex flex-col">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t('common.created')}: {new Date(game.created_at).toLocaleDateString()}
                    </div>

                    <Button
                      onClick={() => handlePlayGame(game.id)}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300 text-white font-bold py-3 rounded-lg group/btn mt-auto"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {t('play.playNow')}
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}