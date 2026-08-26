'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Search, Calendar, Filter, MoreVertical, Activity, CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const getEventIcon = (action: string) => {
    if (action.includes('LOGIN_SUCCESS')) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (action.includes('LOGIN_FAILED')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (action.includes('PASSWORD_CHANGED') || action.includes('PASSWORD')) return <Clock className="w-5 h-5 text-yellow-500" />;
    if (action.includes('DELETE')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (action.includes('CREATE') || action.includes('UPLOAD')) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <Activity className="w-5 h-5 text-blue-500" />;
  };

  const getEventName = (action: string) => {
    if (action.includes('LOGIN_SUCCESS')) return 'Login Success';
    if (action.includes('LOGIN_FAILED')) return 'Login Failed';
    if (action.includes('PASSWORD')) return 'Password Changed';
    if (action.includes('CREATED')) return action.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return action.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getEventDescription = (action: string, details: any) => {
    if (action.includes('LOGIN_SUCCESS')) return 'User logged in successfully';
    if (action.includes('LOGIN_FAILED')) return `Login failed: ${details.reason || 'Invalid credentials'}`;
    if (action.includes('PASSWORD')) return 'User updated password';
    if (action.includes('CREATED')) return `${details.question_text ? 'Question created' : 'Item created'}`;
    if (action.includes('UPDATED')) return 'Item updated';
    if (action.includes('DELETED')) return 'Item deleted';
    return 'System activity recorded';
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.user_email && activity.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activity.ip_address && activity.ip_address.toLowerCase().includes(searchTerm.toLowerCase()));
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
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="border-border/50 bg-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, type, or IP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-input/50 border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-input/50 border-border/50 focus:border-primary/50"
                placeholder="Select Date"
              />
            </div>
            <Select value={filterAction} onValueChange={(value) => {
              setFilterAction(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="bg-input/50 border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                <SelectItem value="all">All Types</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {getEventName(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="border-border/50 bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
            </div>
          </div>
        ) : paginatedActivities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t('activity.noActivity')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-3 border-b border-border/20 bg-muted/50 flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-8"></div>
              <div className="flex-1">EVENT</div>
              <div className="flex-1">USER</div>
              <div className="w-24">ROLE</div>
              <div className="w-24">IP ADDRESS</div>
              <div className="w-32">TIME</div>
              <div className="w-8"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/20">
              {paginatedActivities.map((activity) => {
                const details = activity.details ? JSON.parse(typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)) : {};
                const username = details.user_email || activity.user_email || 'System';
                const role = details.role || 'User';
                const timestamp = new Date(activity.created_at);
                const timeStr = timestamp.toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={activity.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="w-8 flex justify-center">
                      {getEventIcon(activity.action)}
                    </div>

                    {/* Event */}
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">{getEventName(activity.action)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{getEventDescription(activity.action, details)}</div>
                    </div>

                    {/* User */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">{username.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-foreground">{username}</span>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="w-24">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600 border border-blue-500/30">
                        {role}
                      </span>
                    </div>

                    {/* IP Address */}
                    <div className="w-24 text-sm text-muted-foreground">
                      {activity.ip_address || '—'}
                    </div>

                    {/* Time */}
                    <div className="w-32 text-sm text-muted-foreground">
                      {timeStr}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activities
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-border/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-xs text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-border/50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
