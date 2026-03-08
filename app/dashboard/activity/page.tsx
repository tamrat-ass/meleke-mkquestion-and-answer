'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_email?: string;
}

export default function ActivityPage() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (error) {
      console.error(' Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-400';
    if (action.includes('CREATE') || action.includes('UPLOAD')) return 'text-green-400';
    if (action.includes('UPDATE')) return 'text-blue-400';
    if (action.includes('LOGIN')) return 'text-purple-400';
    return 'text-muted-foreground';
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.user_email && activity.user_email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = filterAction === 'all' || activity.action === filterAction;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const activityDate = new Date(activity.created_at);
      if (dateFrom) {
        matchesDate = matchesDate && activityDate >= new Date(dateFrom);
      }
      if (dateTo) {
        matchesDate = matchesDate && activityDate <= new Date(dateTo);
      }
    }

    return matchesSearch && matchesAction && matchesDate;
  });

  const uniqueActions = [...new Set(activities.map((a) => a.action))];

  const handleExport = () => {
    const csv = [
      ['Date', 'User', 'Action', 'Entity Type', 'IP Address', 'Details'].join(','),
      ...filteredActivities.map((a) =>
        [
          new Date(a.created_at).toLocaleString(),
          a.user_email || 'System',
          a.action,
          a.entity_type || '',
          a.ip_address || '',
          JSON.stringify(a.details || '{}'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('activity.activityLog')}</h2>
          </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="border-border/50 hover:bg-secondary bg-transparent"
        >
          <Download className="mr-2 h-4 w-4" />
          {t('common.export')}
        </Button>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('common.search')}</CardTitle>
          <CardDescription>{t('activity.activityLog')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={t('activity.username')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border/50"
          />
          <div className="flex gap-2 flex-wrap">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48 bg-input border-border/50">
                <SelectValue placeholder={t('common.action')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40 bg-input border-border/50"
              placeholder={t('common.fromDate')}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40 bg-input border-border/50"
              placeholder={t('common.toDate')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('activity.activityLog')} ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('activity.noActivity')}</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredActivities.map((activity) => {
                const details = activity.details ? JSON.parse(typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)) : {};
                const username = details.username || activity.user_email || 'System';
                const fullName = details.full_name || '';
                const timestamp = details.timestamp ? new Date(details.timestamp).toLocaleString() : new Date(activity.created_at).toLocaleString();
                
                return (
                  <div
                    key={activity.id}
                    className="border border-border/20 rounded p-4 hover:border-primary/30 hover:bg-secondary/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className={`text-sm font-semibold ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('activity.username')}: {username} {fullName && `(${fullName})`} | {t('common.action')}: {activity.entity_type}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {timestamp}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {details.role && <p>{t('activity.role')}: {details.role}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
