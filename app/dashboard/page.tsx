'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Users, HelpCircle, Layers } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

interface Stats {
  totalGames: number;
  totalQuestions: number;
  totalRounds: number;
  totalActiveUsers: number;
  activeGames: number;
}

interface ChartData {
  round: string;
  games: number;
  questions: number;
  questionTypes?: Array<{
    type: string;
    count: number;
  }>;
}

interface QuestionDistribution {
  type: string;
  count: number;
  color: string;
  percentage?: number;
}

function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    totalQuestions: 0,
    totalRounds: 0,
    totalActiveUsers: 0,
    activeGames: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [questionDistribution, setQuestionDistribution] = useState<QuestionDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questionTypesMap, setQuestionTypesMap] = useState<{ [key: string]: { bg: string; text: string; color: string } }>({});

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 10 seconds to catch changes made on other pages
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, distributionRes, typesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/games-questions'),
        fetch('/api/dashboard/question-distribution'),
        fetch('/api/question-types'),
      ]);

      // Fetch question types first
      let typeColors: { [key: string]: { bg: string; text: string; color: string } } = {};
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        const colors = [
          { bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', color: '#3b82f6' },
          { bg: 'bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', color: '#f59e0b' },
          { bg: 'bg-green-500/20', text: 'text-green-700 dark:text-green-400', color: '#10b981' },
          { bg: 'bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', color: '#8b5cf6' },
          { bg: 'bg-pink-500/20', text: 'text-pink-700 dark:text-pink-400', color: '#ec4899' },
          { bg: 'bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400', color: '#6b7280' },
          { bg: 'bg-red-500/20', text: 'text-red-700 dark:text-red-400', color: '#ef4444' },
        ];
        
        typesData.question_types.forEach((type: any, index: number) => {
          typeColors[type.name] = colors[index % colors.length];
        });
        setQuestionTypesMap(typeColors);
      }

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
        
        const formatted = distData.distribution
          .map((item: any) => ({
            type: item.name.replace(/_/g, ' ').toUpperCase(),
            typeName: item.name,
            count: item.value,
            color: typeColors[item.name]?.color || '#6b7280',
          }))
          .filter((item: any) => typeColors[item.typeName]); // Only include question types that exist

        // Apply largest remainder method to ensure percentages sum to 100%
        const totalCount = formatted.reduce((sum: number, q: any) => sum + q.count, 0);
        const percentagesWithRemainders = formatted.map((item: any) => {
          const exactPercentage = (item.count / totalCount) * 100;
          return {
            ...item,
            exactPercentage,
            percentage: Math.floor(exactPercentage),
            remainder: exactPercentage - Math.floor(exactPercentage),
          };
        });

        // Sort by remainder (descending) and allocate remaining percentage points
        const remainingPoints = 100 - percentagesWithRemainders.reduce((sum: number, q: any) => sum + q.percentage, 0);
        percentagesWithRemainders.sort((a: any, b: any) => b.remainder - a.remainder);

        for (let i = 0; i < remainingPoints; i++) {
          percentagesWithRemainders[i].percentage += 1;
        }

        // Sort back by the order of question types
        const typeOrder = Object.keys(typeColors);
        percentagesWithRemainders.sort((a: any, b: any) => {
          return typeOrder.indexOf(a.typeName) - typeOrder.indexOf(b.typeName);
        });

        const finalFormatted = percentagesWithRemainders.map((item: any) => ({
          type: item.type,
          typeName: item.typeName,
          count: item.count,
          color: item.color,
          percentage: item.percentage,
        }));

        setQuestionDistribution(finalFormatted as any);
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
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl hover:shadow-red-900/50 transition-all duration-300">
          <CardHeader className="pb-1.5 px-2 py-1.5">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" />
              {t('dashboard.totalGames')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 py-0.5">
            <div className="text-xl font-bold text-foreground">{stats.totalGames}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stats.activeGames} {t('dashboard.active')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl hover:shadow-red-900/50 transition-all duration-300">
          <CardHeader className="pb-1.5 px-2 py-1.5">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              {t('dashboard.totalQuestions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 py-0.5">
            <div className="text-xl font-bold text-foreground">{stats.totalQuestions}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('dashboard.acrossAllGames')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl hover:shadow-red-900/50 transition-all duration-300">
          <CardHeader className="pb-1.5 px-2 py-1.5">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {t('dashboard.totalRounds')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 py-0.5">
            <div className="text-xl font-bold text-foreground">{stats.totalRounds}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('dashboard.acrossAllGames')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl hover:shadow-red-900/50 transition-all duration-300">
          <CardHeader className="pb-1.5 px-2 py-1.5">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {t('dashboard.totalActiveUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 py-0.5">
            <div className="text-xl font-bold text-foreground">{stats.totalActiveUsers}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('dashboard.activeUsers')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Area Chart */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="pb-1 px-2 py-2 border-b border-border/20">
            <CardTitle className="text-xs">{t('dashboard.gamesAndQuestions')}</CardTitle>
            <CardDescription className="text-[10px]">{t('dashboard.acrossRounds')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 px-1">
            {chartData.length > 0 ? (
              <div className="space-y-4">
                {/* Area Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={180}>
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
                </div>

                {/* Bar Chart Comparison */}
                {/* Summary Table */}
                <div className="border-t border-border/30 pt-4">
                  <h3 className="text-xs font-semibold text-foreground mb-2">{t('dashboard.detailedBreakdown')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
                          <th className="text-left py-2 px-2 font-bold text-foreground">{t('common.round')}</th>
                          <th className="text-center py-2 px-2 font-bold text-foreground">{t('common.games')}</th>
                          <th className="text-left py-2 px-2 font-bold text-foreground">{t('dashboard.questionsBreakdown')}</th>
                          <th className="text-center py-2 px-2 font-bold text-foreground">{t('common.total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((round) => (
                          <tr 
                            key={round.round} 
                            className="border-b border-border/20 hover:bg-secondary/50 transition-all duration-200 group"
                          >
                            <td className="py-2 px-2 font-semibold text-foreground group-hover:text-primary text-xs">{round.round}</td>
                            <td className="text-center py-2 px-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-xs shadow-sm">
                                {round.games}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex flex-wrap gap-1">
                                {round.questionTypes && round.questionTypes.length > 0 ? (
                                  round.questionTypes.map((qType: any) => {
                                    const colors = questionTypesMap[qType.type];
                                    const defaultColors = { 
                                      bg: 'bg-gray-500/20', 
                                      text: 'text-gray-700 dark:text-gray-400' 
                                    };
                                    const colorClass = colors || defaultColors;
                                    
                                    return (
                                      <div
                                        key={qType.type}
                                        className={`inline-flex items-center gap-1 ${colorClass.bg} ${colorClass.text} px-2 py-0.5 rounded-md font-medium text-xs transition-all duration-200 hover:shadow-md whitespace-nowrap`}
                                      >
                                        <span className="truncate">
                                          {qType.type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="font-bold">{qType.count}</span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">{t('common.noQuestions')}</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-2 px-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/10 text-foreground rounded-lg font-bold text-xs shadow-sm">
                                {round.games + round.questions}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('dashboard.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-lg">
          <CardHeader className="pb-1 px-2 py-1 border-b border-border/20">
            <CardTitle className="text-xs">{t('dashboard.questionsDistribution')}</CardTitle>
            <CardDescription className="text-[10px]">{t('dashboard.byQuestionType')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-1 px-1">{questionDistribution.length > 0 ? (
              <div className="space-y-4">
                {/* Circular Progress Indicators */}
                <div className="flex justify-center items-center gap-6 py-3 flex-wrap">
                  {questionDistribution.map((item) => {
                    const percentage = item.percentage || 0;
                    const circumference = 2 * Math.PI * 60;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;
                    
                    return (
                      <div key={item.type} className="flex flex-col items-center gap-2 group">
                        <div className="relative w-40 h-40 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            {/* Outer ring */}
                            <circle
                              cx="60"
                              cy="60"
                              r="55"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="2"
                              opacity="0.2"
                            />
                            {/* Background circle */}
                            <circle
                              cx="60"
                              cy="60"
                              r="45"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="10"
                            />
                            {/* Progress circle */}
                            <circle
                              cx="60"
                              cy="60"
                              r="45"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="10"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              style={{ 
                                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                filter: `drop-shadow(0 0 8px ${item.color}40)`
                              }}
                            />
                          </svg>
                          {/* Center content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-foreground">{item.count}</span>
                            <span className="text-xs text-muted-foreground">{t('common.questions')}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-foreground whitespace-nowrap">{item.type}</p>
                          <p className="text-xl font-bold mt-1" style={{ color: item.color }}>
                            {percentage}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bar Chart */}
                <div className="border-t border-border/30 pt-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3">{t('dashboard.distributionBreakdown')}</h3>
                  <div className="space-y-3">
                    {questionDistribution.map((item) => {
                      const percentage = item.percentage || 0;
                      return (
                        <div key={item.type} className="space-y-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">{item.type}</span>
                            <span className="text-xs font-bold" style={{ color: item.color }}>
                              {item.count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: item.color
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
