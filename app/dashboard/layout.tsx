'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Settings, Users, Gamepad2, HelpCircle, Layers, Sun, Moon, Globe } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { useLanguage } from '@/lib/i18n/context';

interface User {
  id: string | number;
  email: string;
  full_name: string;
  role_name: string;
  permissions?: string[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'Create & Manage': true,
    'Play': true,
    'Admin': true,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    setIsLoading(false);

    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('light', initialTheme === 'light');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { href: '/dashboard', label: t('sidebar.overview'), icon: Gamepad2, permission: 'dashboard.view' },
    { section: t('sidebar.createManage') },
    { href: '/dashboard/games/new', label: t('sidebar.createGame'), icon: Gamepad2, permission: 'games.create' },
    { href: '/dashboard/games', label: t('sidebar.manageGames'), icon: Gamepad2, permission: 'games.read' },
    { href: '/dashboard/rounds', label: t('sidebar.manageRounds'), icon: Layers, permission: 'rounds.read' },
    { href: '/dashboard/questions', label: t('sidebar.questions'), icon: HelpCircle, permission: 'questions.read' },
    { section: t('sidebar.play') },
    { href: '/play', label: t('sidebar.playGame'), icon: Gamepad2, permission: 'games.play' },
    { section: t('sidebar.admin') },
    { href: '/dashboard/users', label: t('sidebar.users'), icon: Users, permission: 'users.read' },
    { href: '/dashboard/permissions', label: t('sidebar.permissions'), icon: Settings, permission: 'users.update' },
    { href: '/dashboard/activity', label: t('sidebar.activityLog'), icon: Settings, permission: 'dashboard.activity' },
    { href: '/dashboard/configuration', label: t('sidebar.configuration'), icon: Settings, permission: 'configuration.view' },
  ];

  // For admin users, show all items regardless of permissions
  // For player users, automatically grant games.play permission
  const userWithDefaults = user ? {
    ...user,
    permissions: user.permissions || (user.role_name === 'player' ? ['games.play'] : [])
  } : null;

  const visibleItems = user?.role_name === 'admin' 
    ? navigationItems 
    : navigationItems.filter((item) => {
        // Always show section headers initially
        if ('section' in item) return true;
        // Filter other items by permission
        return 'permission' in item && item.permission ? hasPermission(userWithDefaults, item.permission) : true;
      });

  // Remove section headers that have no visible items
  const finalVisibleItems = visibleItems.filter((item, index) => {
    if (!('section' in item)) return true; // Keep non-section items
    
    // For section headers, check if there are any items after it before the next section
    for (let i = index + 1; i < visibleItems.length; i++) {
      if ('section' in visibleItems[i]) break; // Found next section
      if ('href' in visibleItems[i]) return true; // Found an item in this section
    }
    return false; // No items in this section
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-card border-r border-border/50 transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold text-primary">{t('sidebar.quizmaster')}</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto text-primary"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* User Info */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-border/30">
            <p className="text-sm font-medium text-foreground truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
              {user?.role_name?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {finalVisibleItems.map((item, index) => {
            if ('section' in item) {
              const section = item.section as string;
              const isExpanded = expandedSections[section];
              // Get items until next section
              const sectionItems = [];
              for (let i = index + 1; i < finalVisibleItems.length; i++) {
                if ('section' in finalVisibleItems[i]) break;
                sectionItems.push(finalVisibleItems[i]);
              }
              
              return (
                <div key={`section-${index}`} className="pt-4 pb-2">
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-primary/10 rounded-lg transition-all duration-200 group"
                  >
                    {isSidebarOpen && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase group-hover:text-primary transition-colors">{section}</p>
                    )}
                    {isSidebarOpen && (
                      <span className={`text-muted-foreground transition-all duration-300 transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 mt-1 pl-2 border-l border-primary/20">
                      {sectionItems.map((subItem) => {
                        if (!('href' in subItem) || !subItem.href || !subItem.icon) return null;
                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-foreground/70 hover:text-primary hover:bg-primary/10 transition-all duration-200 text-sm py-1.5"
                            >
                              <subItem.icon className="w-4 h-4" />
                              {isSidebarOpen && <span className="ml-3">{subItem.label}</span>}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Show Overview item
            if (index === 0) {
              if (!('href' in item) || !item.href || !item.icon) return null;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 mb-4"
                  >
                    <item.icon className="w-5 h-5" />
                    {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                  </Button>
                </Link>
              );
            }
            return null;
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/30">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start border-border/10 text-destructive hover:bg-destructive/10 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span className="ml-3">{t('common.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <header className="bg-card border-b border-border/50 p-4 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.dashboard')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">{t('common.welcomeBack')}, {user?.full_name}!</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="text-foreground hover:bg-primary/10"
              title={`Switch to ${language === 'en' ? 'Amharic' : 'English'}`}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-primary/10"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
