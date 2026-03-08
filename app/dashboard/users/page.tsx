'use client';

import { useEffect, useState } from 'react';
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
import { Trash2, Edit2, Plus, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface User {
  id: number;
  email: string;
  full_name: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
  permissions?: string[];
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error(' Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: user.full_name,
          email: user.email,
          role_name: user.role_name,
          is_active: !currentStatus,
          permissions: user.permissions || [],
        }),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        ));
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('common.confirm'))) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        alert(t('common.deleted'));
      } else {
        const errorData = await response.json();
        alert(`${t('common.error')}: ${errorData.error || t('common.failedDelete')}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t('common.error'));
    }
  };

  const handleResetPassword = async (userId: number, userEmail: string) => {
    const newPassword = prompt(`${t('users.enterPassword')} ${userEmail}:`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert(t('common.passwordMinLength'));
      return;
    }

    try {
      const response = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(userId),
          newPassword,
        }),
      });

      if (response.ok) {
        alert(t('common.passwordReset'));
      } else {
        const errorData = await response.json();
        alert(`${t('common.error')}: ${errorData.error || t('common.failedReset')}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(t('common.error'));
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role_name === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('users.users')}</h2>
          <p className="text-muted-foreground">{t('users.manageUsers')}</p>
        </div>
        <Link href="/dashboard/users/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            {t('users.newUser')}
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('common.search')}</CardTitle>
          <CardDescription>{t('users.manageUsers')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={t('users.email')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border/50"
          />
          <div className="flex gap-2">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48 bg-input border-border/50">
                <SelectValue placeholder={t('users.role')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="admin">{t('common.admin')}</SelectItem>
                <SelectItem value="teacher">{t('common.teacher')}</SelectItem>
                <SelectItem value="player">{t('common.player')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{t('users.users')} ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('users.noUsers')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/30">
                  <tr>
                    <th className="text-left p-3 font-medium">{t('users.fullName')}</th>
                    <th className="text-left p-3 font-medium">{t('users.email')}</th>
                    <th className="text-left p-3 font-medium">{t('users.role')}</th>
                    <th className="text-left p-3 font-medium">{t('common.status')}</th>
                    <th className="text-left p-3 font-medium">{t('common.created')}</th>
                    <th className="text-left p-3 font-medium">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                      <td className="p-3">{user.full_name}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <span className="inline-block px-3 py-1 text-xs bg-primary/20 text-primary rounded-full">
                          {user.role_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                          user.is_active
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-red-500/20 text-red-600'
                        }`}>
                          {user.is_active ? t('users.active') : t('users.inactive')}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${
                            user.is_active
                              ? 'text-muted-foreground hover:text-red-600'
                              : 'text-muted-foreground hover:text-green-600'
                          }`}
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          disabled={togglingId === user.id}
                          title={user.is_active ? t('common.deactivate') : t('common.activate')}
                        >
                          {user.is_active ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                          onClick={() => handleResetPassword(user.id, user.email)}
                          title={t('common.resetPassword')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Link href={`/dashboard/users/${user.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        {currentUser?.id !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
