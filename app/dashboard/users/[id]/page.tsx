'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';

interface User {
  id: string | number;
  email: string;
  full_name: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
  permissions: string[];
}

interface PermissionGroup {
  category: string;
  permissions: { key: string; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Create & Manage',
    permissions: [
      { key: 'games.create', label: 'Create Games' },
      { key: 'games.read', label: 'View Games' },
      { key: 'rounds.read', label: 'Manage Rounds' },
      { key: 'questions.read', label: 'Manage Questions' },
      { key: 'questions.create', label: 'Create Questions' },
      { key: 'questions.upload', label: 'Upload Questions' }
    ]
  },
  {
    category: 'Play',
    permissions: [
      { key: 'games.play', label: 'Play Games' }
    ]
  },
  {
    category: 'Admin',
    permissions: [
      { key: 'users.read', label: 'View Users' },
      { key: 'users.update', label: 'Manage Permissions' },
      { key: 'dashboard.activity', label: 'View Activity Log' },
      { key: 'configuration.view', label: 'View Configuration' }
    ]
  }
];

export default function EditUserPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('player');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const foundUser = data.users.find((u: User) => u.id.toString() === userId || u.id === userId);
        if (foundUser) {
          setUser(foundUser);
          setFullName(foundUser.full_name);
          setEmail(foundUser.email);
          setRole(foundUser.role_name);
          setIsActive(foundUser.is_active);
          setSelectedPermissions(new Set(foundUser.permissions || []));
        } else {
          setError('User not found');
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const handleSelectAllInGroup = (permissions: string[]) => {
    const newPermissions = new Set(selectedPermissions);
    const allSelected = permissions.every(p => newPermissions.has(p));
    
    permissions.forEach(p => {
      if (allSelected) {
        newPermissions.delete(p);
      } else {
        newPermissions.add(p);
      }
    });
    
    setSelectedPermissions(newPermissions);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim()) {
      setError(t('users.fullName') + ' ' + t('common.and') + ' ' + t('users.email') + ' ' + t('common.required'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          role_name: role,
          is_active: isActive,
          permissions: Array.from(selectedPermissions),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('common.error'));
        return;
      }

      setSuccess('✓ ' + t('users.userUpdated'));
      setTimeout(() => {
        router.push('/dashboard/users');
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Update user error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-destructive">{t('users.userNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/users')}
          className="border-border/50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('common.edit')} {t('users.user')}</h2>
          <p className="text-muted-foreground">{t('users.manageUserDetails')}</p>
        </div>
      </div>

      <form onSubmit={handleSaveUser} className="space-y-6">
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

        {/* User Details Card */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('users.userDetails')}</CardTitle>
            <CardDescription>{t('users.updateUserInfo')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('users.fullName')} *</label>
              <Input
                placeholder={t('users.enterFullName')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSaving}
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('users.email')} *</label>
              <Input
                type="email"
                placeholder={t('users.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('users.role')}</label>
              <Select value={role} onValueChange={setRole} disabled={isSaving}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue placeholder={t('users.selectRole')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="admin">{t('users.admin')}</SelectItem>
                  <SelectItem value="teacher">{t('users.teacher')}</SelectItem>
                  <SelectItem value="player">{t('users.player')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border/30">
              <Checkbox
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                disabled={isSaving}
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-foreground cursor-pointer flex-1"
              >
                {t('users.activeUser')}
              </label>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isActive 
                  ? 'bg-green-500/20 text-green-600' 
                  : 'bg-red-500/20 text-red-600'
              }`}>
                {isActive ? t('users.active') : t('users.inactive')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('permissions.managePermissions')}</CardTitle>
            <CardDescription>
              {t('permissions.selectPermissions')} ({selectedPermissions.size} {t('common.selected')})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {PERMISSION_GROUPS.map((group) => {
              const groupPermissions = group.permissions.map(p => p.key);
              const allSelected = groupPermissions.every(p => selectedPermissions.has(p));
              const someSelected = groupPermissions.some(p => selectedPermissions.has(p));

              return (
                <div key={group.category} className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                    <Checkbox
                      id={`group-${group.category}`}
                      checked={allSelected || someSelected}
                      onCheckedChange={() => handleSelectAllInGroup(groupPermissions)}
                      disabled={isSaving}
                    />
                    <label
                      htmlFor={`group-${group.category}`}
                      className="font-semibold text-foreground cursor-pointer flex-1"
                    >
                      {group.category}
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                    {group.permissions.map((perm) => (
                      <div key={perm.key} className="flex items-center gap-2">
                        <Checkbox
                          id={perm.key}
                          checked={selectedPermissions.has(perm.key)}
                          onCheckedChange={() => handlePermissionToggle(perm.key)}
                          disabled={isSaving}
                        />
                        <label
                          htmlFor={perm.key}
                          className="text-sm text-muted-foreground cursor-pointer flex-1"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? t('common.saving') : t('common.saveChanges')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/users')}
            disabled={isSaving}
            className="border-border/50"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
