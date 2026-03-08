'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Trash2, Play, Edit2, Plus, Play as PlayIcon } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface Game {
  id: string;
  title: string;
  status: string;
  created_at: string;
  round_id: string;
  round_name: string;
  round_number: number;
}

export default function GamesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm(t('common.confirm'))) return;

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGames(games.filter((g) => g.id !== gameId));
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
        }),
      });

      if (response.ok) {
        // Update the game status in the list
        setGames(games.map((g) => 
          g.id === gameId ? { ...g, status: 'active' } : g
        ));
        
        // Use router.push instead of window.location.href to preserve session
        router.push(`/game/${gameId}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.round_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || game.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Group games by round
  const gamesByRound = filteredGames.reduce((acc, game) => {
    const roundKey = game.round_id || 'no-round';
    if (!acc[roundKey]) {
      acc[roundKey] = {
        round_id: game.round_id,
        round_name: game.round_name || 'No Round',
        round_number: game.round_number || 0,
        games: [],
      };
    }
    acc[roundKey].games.push(game);
    return acc;
  }, {} as Record<string, any>);

  const sortedRounds = Object.values(gamesByRound).sort((a, b) => a.round_number - b.round_number);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-muted/50 text-muted-foreground';
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-secondary/50 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('games.games')}</h2>
          <p className="text-muted-foreground">{t('games.manageGames')}</p>
        </div>
        <Link href="/dashboard/games/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            {t('games.newGame')}
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('common.search')}</CardTitle>
          <CardDescription>{t('games.selectGame')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={t('games.gameName')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border/50"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-input border-border/50">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/50">
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="draft">{t('common.draft')}</SelectItem>
              <SelectItem value="active">{t('common.active')}</SelectItem>
              <SelectItem value="completed">{t('common.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('games.games')} ({filteredGames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('games.noGames')} {games.length === 0 ? t('games.createFirst') : ''}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedRounds.map((round) => (
                <div key={round.round_id} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {round.round_name} (Round {round.round_number})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {round.games.map((game: Game) => (
                      <div
                        key={game.id}
                        className="border border-border/30 rounded-lg p-4 hover:border-primary/30 hover:bg-secondary/20 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{game.title}</h4>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ml-2 ${getStatusColor(game.status)}`}>
                            {t(`common.${game.status}`)}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground mb-4">
                          {t('common.created')}: {new Date(game.created_at).toLocaleDateString()}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              // Start game - update status to active
                              handleStartGame(game.id);
                            }}
                          >
                            <PlayIcon className="h-4 w-4 mr-2" />
                            {t('play.playNow')}
                          </Button>
                          <Link href={`/dashboard/games/${game.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full border-border/50 bg-transparent">
                              <Edit2 className="h-4 w-4 mr-2" />
                              {t('common.edit')}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteGame(game.id)}
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
