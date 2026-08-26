'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  LogOut,
  Settings,
  Users,
  Gamepad2,
  HelpCircle,
  Layers,
  ChevronDown,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';
import { hasPermission } from '@/lib/permissions';
import { usePathname } from 'next/navigation';

interface User {
  id: string | number;
  email: string;
  full_name: string;
  role_name: string;
  permissions?: string[];
}

interface SidebarProps {
  user: User | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export function Sidebar({
  user,
  isSidebarOpen,
  onToggleSidebar,
  onLogout,
}: SidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    'Create & Manage': true,
    Play: true,
    Admin: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navigationItems = [
    { href: '/dashboard', label: t('sidebar.overview'), icon: Gamepad2, permission: 'dashboard.view' },
    { section: 'Create & Manage' },
    { href: '/dashboard/games/new', label: t('sidebar.createGame'), icon: Gamepad2, permission: 'games.create' },
    { href: '/dashboard/games', label: t('sidebar.manageGames'), icon: Gamepad2, permission: 'games.read' },
    { href: '/dashboard/rounds', label: t('sidebar.manageRounds'), icon: Layers, permission: 'rounds.read' },
    { href: '/dashboard/questions', label: t('sidebar.questions'), icon: HelpCircle, permission: 'questions.read' },
    { section: 'Play' },
    { href: '/play', label: t('sidebar.playGame'), icon: Gamepad2, permission: 'games.play' },
    { section: 'Admin' },
    { href: '/dashboard/users', label: t('sidebar.users'), icon: Users, permission: 'users.read' },
    { href: '/dashboard/permissions', label: t('sidebar.permissions'), icon: Settings, permission: 'users.update' },
    { href: '/dashboard/reset-question-status', label: t('sidebar.resetQuestionStatus'), icon: RotateCcw, permission: 'users.update' },
    { href: '/dashboard/configuration', label: t('sidebar.questionTypes'), icon: Sliders, permission: 'configuration.view' },
    { href: '/dashboard/activity', label: t('sidebar.activityLog'), icon: Settings, permission: 'dashboard.activity' },
  ];

  const userWithDefaults = user
    ? {
        ...user,
        permissions: user.permissions || (user.role_name === 'player' ? ['games.play'] : []),
      }
    : null;

  const visibleItems =
    user?.role_name === 'admin'
      ? navigationItems
      : navigationItems.filter((item) => {
          if ('section' in item) return true;
          return 'permission' in item && item.permission
            ? hasPermission(userWithDefaults, item.permission)
            : true;
        });

  const finalVisibleItems = visibleItems.filter((item, index) => {
    if (!('section' in item)) return true;

    for (let i = index + 1; i < visibleItems.length; i++) {
      if ('section' in visibleItems[i]) break;
      if ('href' in visibleItems[i]) return true;
    }
    return false;
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // Exact match for specific pages
    if (pathname === href) {
      return true;
    }
    
    // For parent routes, check if pathname starts with href and next character is /
    // This prevents /dashboard/games from matching /dashboard/games/new
    return pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`bg-card border-r border-border transition-all duration-300 flex flex-col ${
        isSidebarOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        {isSidebarOpen && (
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-foreground">{t('auth.quizmaster')}</span>
              <span className="text-red-700 dark:text-red-600">{t('auth.quizmasterBrand')}</span>
            </h1>
            <p className="text-sm text-muted-foreground">{t('sidebar.platformSubtitle')}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* User Card */}
      {isSidebarOpen && user && (
        <div className="m-4 p-4 rounded-2xl bg-red-900/20 dark:bg-red-950/30 border border-red-800 dark:border-red-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-900/30 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {user.full_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-red-900/30 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
            {user.role_name?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3">
        {/* Overview */}
        <div className="space-y-1 mb-4">
          {finalVisibleItems.map((item, index) => {
            if (index === 0 && 'href' in item && item.href) {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      active
                        ? 'bg-red-900/20 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-l-4 border-red-600'
                        : 'text-foreground/70 hover:bg-muted/50 dark:hover:bg-muted/30'
                    }`}
                  >
                    <item.icon size={20} />
                    {isSidebarOpen && (
                      <span className={`font-medium ${active ? 'text-red-600' : ''}`}>
                        {item.label}
                      </span>
                    )}
                  </button>
                </Link>
              );
            }
            return null;
          })}
        </div>

        {/* Sections */}
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
              <div key={`section-${index}`} className="mt-6">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase font-bold text-muted-foreground hover:text-foreground transition"
                >
                  {isSidebarOpen && <span>{section}</span>}
                  {isSidebarOpen && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <nav className="space-y-1 mt-2">
                    {sectionItems.map((subItem) => {
                      if (
                        !('href' in subItem) ||
                        !subItem.href ||
                        !subItem.icon
                      )
                        return null;

                      const active = isActive(subItem.href);

                      return (
                        <Link key={subItem.href} href={subItem.href}>
                          <button
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                              active
                                ? 'bg-red-900/20 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-l-4 border-red-600'
                                : 'text-foreground/70 hover:bg-muted/50 dark:hover:bg-muted/30'
                            }`}
                          >
                            <subItem.icon size={18} />
                            {isSidebarOpen && (
                              <span className="text-sm">{subItem.label}</span>
                            )}
                          </button>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-900/20 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-900/30 dark:hover:bg-red-950/40 transition border border-red-800 dark:border-red-900"
        >
          <LogOut size={18} />
          {isSidebarOpen && <span className="font-medium">{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
