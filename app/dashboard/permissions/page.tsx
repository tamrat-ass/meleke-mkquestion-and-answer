'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/i18n/context';

interface User {
  id: string | number;
  email: string;
  full_name: string;
  role_name: string;
  permissions?: string[];
}

interface PermissionGroup {
  name: string;
  description: string;
  permissions: {
    key: string;
    label: string;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Create & Manage',
    description: 'Control access to game creation and management features',
    permissions: [
      {
        key: 'games.create',
        label: 'Create Games',
        description: 'Allow users to create new games'
      },
      {
        key: 'games.read',
        label: 'View Games',
        description: 'Allow users to view and manage existing games'
      },
      {
        key: 'rounds.read',
        label: 'Manage Rounds',
        description: 'Allow users to view and manage rounds'
      },
      {
        key: 'questions.read',
        label: 'Manage Questions',
        description: 'Allow users to view and manage questions'
      },
      {
        key: 'questions.create',
        label: 'Create Questions',
        description: 'Allow users to create new questions'
      },
      {
        key: 'questions.upload',
        label: 'Upload Questions',
        description: 'Allow users to upload questions via file'
      }
    ]
  },
  {
    name: 'Play',
    description: 'Control access to game playing features',
    permissions: [
      {
        key: 'games.play',
        label: 'Play Games',
        description: 'Allow users to play games'
      }
    ]
  },
  {
    name: 'Admin',
    description: 'Control access to admin features',
    permissions: [
      {
        key: 'users.read',
        label: 'View Users',
        description: 'Allow users to view user list'
      },
      {
        key: 'users.update',
        label: 'Manage Permissions',
        description: 'Allow users to manage user permissions'
      },
      {
        key: 'dashboard.activity',
        label: 'View Activity Log',
        description: 'Allow users to view activity logs'
      },
      {
        key: 'configuration.view',
        label: 'View Configuration',
        description: 'Allow users to view system configuration'
      }
    ]
  }
];

export default function PermissionsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    
    // Only admins can access this page
    if (user.role_name !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        if (data.users && data.users.length > 0) {
          selectUser(data.users[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: t('common.failedLoad') });
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions || []);
    setMessage(null);
  };

  const togglePermission = (permission: string) => {
    setUserPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/permissions/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: userPermissions
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('common.permissionsUpdated') });
        // Update the user in the list
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, permissions: userPermissions }
            : u
        ));
        setSelectedUser({ ...selectedUser, permissions: userPermissions });
      } else {
        setMessage({ type: 'error', text: t('common.failedUpdate') });
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: t('common.errorSaving') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedUser) {
      setUserPermissions(selectedUser.permissions || []);
      setMessage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">{t('permissions.permissions')}</h2>
        <p className="text-muted-foreground">{t('permissions.managePermissions')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Users List */}
        <Card className="border-border/50 bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t('users.users')}</CardTitle>
            <CardDescription>{t('permissions.selectUser')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedUser?.id === user.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/30 hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-sm text-foreground truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-primary mt-1 capitalize">{user.role_name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Editor */}
        <div className="lg:col-span-3 space-y-6">
          {selectedUser ? (
            <>
              {/* User Info */}
              <Card className="border-border/50 bg-card">
                <CardHeader>
                  <CardTitle>{selectedUser.full_name}</CardTitle>
                  <CardDescription>{selectedUser.email}</CardDescription>
                </CardHeader>
              </Card>

              {/* Message */}
              {message && (
                <Alert className={message.type === 'success' ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
                  <AlertCircle className={`h-4 w-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                  <AlertDescription className={message.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* Permission Groups */}
              <div className="space-y-4">
                {PERMISSION_GROUPS.map(group => (
                  <Card key={group.name} className="border-border/50 bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.permissions.map(perm => (
                          <div key={perm.key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                            <Checkbox
                              id={perm.key}
                              checked={userPermissions.includes(perm.key)}
                              onCheckedChange={() => togglePermission(perm.key)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={perm.key}
                                className="text-sm font-medium text-foreground cursor-pointer"
                              >
                                {perm.label}
                              </label>
                              <p className="text-xs text-muted-foreground mt-1">{perm.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-border/50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('common.reset')}
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('common.saving') : t('permissions.grantPermissions')}
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">{t('permissions.selectUser')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
