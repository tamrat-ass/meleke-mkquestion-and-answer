'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Users, HelpCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

interface Stats {
  totalGames: number;
  totalQuestions: number;
  totalUsers: number;
  activeGames: number;
}

interface ChartData {
  round: string;
  games: number;
  questions: number;
}

interface QuestionDistribution {
  type: string;
  count: number;
  color: string;
}

function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    totalQuestions: 0,
    totalUsers: 0,
    activeGames: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [questionDistribution, setQuestionDistribution] = useState<QuestionDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, distributionRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/games-questions'),
        fetch('/api/dashboard/question-distribution'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (chartRes.ok) {
        const chartDataResponse = await chartRes.json();
        setChartData(chartDataResponse.data || []);
      }

      if (distributionRes.ok) {
        const distData = await distributionRes.json();
        const colorMap: { [key: string]: string } = {
          multiple_choice: '#3b82f6',
          true_false: '#10b981',
          short_answer: '#f59e0b',
          essay: '#8b5cf6',
          matching: '#ec4899',
        };
        
        const formatted = distData.distribution
          .filter((item: any) => item.name !== 'sign')
          .map((item: any) => ({
            type: item.name.replace(/_/g, ' ').toUpperCase(),
            count: item.value,
            color: colorMap[item.name] || '#6b7280',
          }));
        setQuestionDistribution(formatted);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              {t('dashboard.totalGames')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalGames}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeGames} {t('dashboard.active')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              {t('dashboard.totalQuestions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.acrossAllGames')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('dashboard.totalUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.registeredUsers')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Chart */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('dashboard.gamesAndQuestions')}</CardTitle>
            <CardDescription>{t('dashboard.acrossRounds')}</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="round" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="games"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorGames)"
                  />
                  <Area
                    type="monotone"
                    dataKey="questions"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorQuestions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('dashboard.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('dashboard.questionsDistribution')}</CardTitle>
            <CardDescription>{t('dashboard.byQuestionType')}</CardDescription>
          </CardHeader>
          <CardContent>
            {questionDistribution.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={questionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="count"
                        label={({ type, count }) => `${count}`}
                        labelLine={false}
                      >
                        {questionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                        labelStyle={{ color: '#f3f4f6' }}
                        formatter={(value) => [`${value} questions`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questionDistribution.map((item) => (
                    <div 
                      key={item.type} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:shadow-md transition-all"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} {item.count === 1 ? 'question' : 'questions'}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {Math.round((item.count / questionDistribution.reduce((sum, q) => sum + q.count, 0)) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('dashboard.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
