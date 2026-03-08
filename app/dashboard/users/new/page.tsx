'use client';

import { useState } from 'react';
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
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function CreateUserPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError(t('common.requiredFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('common.passwordMinLength'));
      return;
    }

    setIsSaving(true);

    try {
      console.log('Creating user with:', { fullName, email, role });
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          role_name: role,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setError(data.error || data.details || t('common.failedCreate'));
        return;
      }

      setSuccess(`✓ ${t('common.userCreated')}`);
      setTimeout(() => {
        router.push('/dashboard/users');
      }, 1500);
    } catch (err) {
      console.error('Create user error:', err);
      setError(t('common.errorOccurred'));
    } finally {
      setIsSaving(false);
    }
  };

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
          <h2 className="text-3xl font-bold text-foreground">{t('users.newUser')}</h2>
          <p className="text-muted-foreground">{t('users.addNew')}</p>
        </div>
      </div>

      <form onSubmit={handleCreateUser} className="space-y-6 max-w-md">
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
            <CardTitle>{t('users.userInfo')}</CardTitle>
            <CardDescription>{t('users.enterDetails')}</CardDescription>
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
              <label className="text-sm font-medium text-foreground">{t('auth.password')} *</label>
              <Input
                type="password"
                placeholder={t('auth.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  <SelectItem value="admin">{t('common.admin')}</SelectItem>
                  <SelectItem value="teacher">{t('common.teacher')}</SelectItem>
                  <SelectItem value="player">{t('common.player')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? t('common.creating') : t('users.newUser')}
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
