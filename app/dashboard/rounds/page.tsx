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

interface Question {
  id: string;
  round_id: string;
  title: string;
  question_type: string;
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
  const [roundDependencies, setRoundDependencies] = useState<Record<string, { questions: number; games: number; sessions: number }>>({});

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
        
        // Fetch dependencies for each round
        const deps: Record<string, { questions: number; games: number; sessions: number }> = {};
        
        for (const round of data.rounds || []) {
          let questionCount = 0;
          let gameCount = 0;
          let sessionCount = 0;

          try {
            // Fetch questions for this round
            const questionsRes = await fetch('/api/questions');
            if (questionsRes.ok) {
              const questionsData = await questionsRes.json();
              questionCount = (questionsData.questions || []).filter((q: Question) => q.round_id === round.id).length;
            }
          } catch (err) {
            console.error('Error fetching questions:', err);
          }

          try {
            // Fetch games for this round
            const gamesRes = await fetch('/api/games');
            if (gamesRes.ok) {
              const gamesData = await gamesRes.json();
              gameCount = (gamesData.games || []).filter((g: any) => g.round_id === round.id).length;
            }
          } catch (err) {
            console.error('Error fetching games:', err);
          }

          try {
            // Fetch game rounds (sessions) for this round
            const sessionsRes = await fetch('/api/game-rounds');
            if (sessionsRes.ok) {
              const sessionsData = await sessionsRes.json();
              sessionCount = (sessionsData.game_rounds || []).filter((s: any) => s.round_id === round.id).length;
            }
          } catch (err) {
            console.error('Error fetching game rounds:', err);
          }

          deps[round.id] = { questions: questionCount, games: gameCount, sessions: sessionCount };
        }
        
        setRoundDependencies(deps);
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState<{
    roundId: string;
    roundName: string;
    questionCount: number;
    gameCount: number;
    sessionCount: number;
  } | null>(null);

  const handleDeleteRoundClick = async (roundId: string, roundName: string) => {
    try {
      // Fetch dependency counts
      const questionsResponse = await fetch(`/api/questions?roundId=${roundId}`);
      const questionsData = questionsResponse.ok ? await questionsResponse.json() : { questions: [] };
      const questionCount = questionsData.questions?.filter((q: Question) => q.round_id === roundId).length || 0;

      const gamesResponse = await fetch(`/api/games?roundId=${roundId}`);
      const gamesData = gamesResponse.ok ? await gamesResponse.json() : { games: [] };
      const gameCount = gamesData.games?.filter((g: any) => g.round_id === roundId).length || 0;

      setDeleteModalData({
        roundId,
        roundName,
        questionCount,
        gameCount,
        sessionCount: 0,
      });
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      setError('Failed to fetch round dependencies');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalData) return;

    // Block deletion if games exist
    if (deleteModalData.gameCount > 0) {
      setError('Cannot delete this round because it has associated games. Please delete all games first.');
      setDeleteModalOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/rounds/${deleteModalData.roundId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✓ Round "${deleteModalData.roundName}" and ${deleteModalData.questionCount} associated questions deleted successfully!`);
        setError('');
        setRounds(rounds.filter((r) => r.id !== deleteModalData.roundId));
        setDeleteModalOpen(false);
        setDeleteModalData(null);
      } else {
        setError(data.error || 'Failed to delete round');
        setSuccess('');
      }
    } catch (error) {
      console.error('Error deleting round:', error);
      setError('An error occurred while deleting the round. Please try again.');
      setSuccess('');
    }
  };

  const isPlayer = userRole === 'player';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('rounds.rounds')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isPlayer ? t('play.selectGame') : t('rounds.manageRounds')}
          </p>
        </div>
        {!isPlayer && (
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="mr-2 h-4 w-4" />
            {t('rounds.newRound')}
          </Button>
        )}
        {isPlayer && (
          <Link href="/dashboard/rounds/select">
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
              <Play className="mr-2 h-4 w-4" />
              {t('play.playNow')}
            </Button>
          </Link>
        )}
      </div>

      {!isPlayer && (
        <>
          {/* Create Round Form */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t('rounds.newRound')}</CardTitle>
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
                    className="bg-input border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('common.description')}</label>
                  <Input
                    placeholder={t('common.descriptionPlaceholder')}
                    value={roundDescription}
                    onChange={(e) => setRoundDescription(e.target.value)}
                    disabled={isCreating}
                    className="bg-input border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
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
      <Card className="border-border/50 bg-card shadow-lg">
        <CardHeader className="pb-4 border-b border-border/20">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{t('rounds.rounds')}</span>
            <span className="bg-gradient-to-r from-primary to-primary/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {rounds.length}
            </span>
          </CardTitle>
          <CardDescription>
            {isPlayer ? t('play.availableGames') : t('rounds.manageRounds')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </div>
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{isPlayer ? t('play.noGamesAvailable') : t('rounds.noRounds')}</p>
              {!isPlayer && (
                <Button className="bg-primary hover:bg-primary/90">
                  {t('rounds.newRound')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="group border border-border/30 rounded-xl p-5 hover:border-primary/50 hover:bg-secondary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="mb-4">
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors mb-1">
                      {round.name}
                    </h3>
                    <span className="text-sm text-muted-foreground font-medium">
                      Round #{round.round_number}
                    </span>
                  </div>

                  {round.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{round.description}</p>
                  )}

                  <div className="text-xs text-muted-foreground mb-4">
                    {new Date(round.created_at).toLocaleDateString()}
                  </div>

                  {!isPlayer && (
                    <div className="bg-muted/30 rounded-lg p-3 mb-4 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Questions:</span>
                        <span className="font-semibold">{roundDependencies[round.id]?.questions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Games:</span>
                        <span className="font-semibold">{roundDependencies[round.id]?.games || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sessions:</span>
                        <span className="font-semibold">{roundDependencies[round.id]?.sessions || 0}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isPlayer ? (
                      <Link href={`/dashboard/rounds/select?roundId=${round.id}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {t('play.playNow')}
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href={`/dashboard/rounds/${round.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${
                            roundDependencies[round.id]?.games > 0
                              ? 'text-yellow-600 hover:bg-yellow-500/10 cursor-not-allowed opacity-50'
                              : 'text-destructive hover:bg-destructive/10'
                          } transition-all`}
                          onClick={() => handleDeleteRoundClick(round.id, round.name)}
                          title={
                            roundDependencies[round.id]?.games > 0
                              ? 'Cannot delete: Round has associated games'
                              : 'Delete round'
                          }
                          disabled={roundDependencies[round.id]?.games > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 border-destructive/30 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-destructive">⚠️ Delete Round</CardTitle>
              <CardDescription>Are you sure you want to delete this round?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning Message */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-destructive">Round: {deleteModalData.roundName}</p>
                <p className="text-sm text-foreground">This action will:</p>
                
                <ul className="text-sm space-y-1 ml-4">
                  {deleteModalData.questionCount > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="text-destructive">✓</span>
                      <span>Delete {deleteModalData.questionCount} associated question{deleteModalData.questionCount !== 1 ? 's' : ''}</span>
                    </li>
                  )}
                  {deleteModalData.gameCount > 0 && (
                    <li className="flex items-center gap-2 text-yellow-600">
                      <span>✗</span>
                      <span>BLOCKED: {deleteModalData.gameCount} game{deleteModalData.gameCount !== 1 ? 's' : ''} using this round</span>
                    </li>
                  )}
                  {deleteModalData.questionCount === 0 && deleteModalData.gameCount === 0 && (
                    <li className="flex items-center gap-2">
                      <span className="text-destructive">✓</span>
                      <span>Delete this round (no associated data)</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Error message if games exist */}
              {deleteModalData.gameCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800">
                    ⚠️ Cannot delete this round because it has {deleteModalData.gameCount} associated game{deleteModalData.gameCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please delete all games using this round first.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeleteModalData(null);
                  }}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleteModalData.gameCount > 0}
                  className={deleteModalData.gameCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {deleteModalData.gameCount > 0 ? 'Delete Blocked' : 'Delete Round'}
                </Button>
              </div>

              {/* Info Text */}
              <p className="text-xs text-muted-foreground text-center">
                This action cannot be undone. Make sure you have backups.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
