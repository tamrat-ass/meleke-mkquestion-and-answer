'use client';

import { useState } from 'react';
import { Globe, Moon, Mail, Lock, Eye, EyeOff, Sun, ArrowRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getDayOfWeek = () => {
    const days = [
      t('common.sunday'),
      t('common.monday'),
      t('common.tuesday'),
      t('common.wednesday'),
      t('common.thursday'),
      t('common.friday'),
      t('common.saturday')
    ];
    return days[new Date().getDay()];
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex overflow-hidden relative ${
      theme === 'dark' 
        ? 'bg-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          theme === 'dark' 
            ? 'bg-red-500/3' 
            : 'bg-red-500/2'
        }`} />
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          theme === 'dark' 
            ? 'bg-blue-500/3' 
            : 'bg-blue-500/2'
        }`} style={{ animationDelay: '1s' }} />
      </div>

      {/* Background Glow on Right */}
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
        theme === 'dark' 
          ? 'bg-red-500/5' 
          : 'bg-red-500/2'
      }`} />

      {/* LEFT SIDE - CHURCH IMAGE & CONTENT */}
      <div className="hidden lg:flex w-3/5 relative overflow-hidden group">
        {/* Church Background Image */}
        <img
          src="/images/lalibela church.png"
          alt="Lalibela Church"
          className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 filter ${
            theme === 'dark' 
              ? 'brightness-90 group-hover:brightness-100' 
              : 'brightness-75 group-hover:brightness-85'
          }`}
        />

        {/* Animated Light Rays */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse ${
          theme === 'dark' ? 'opacity-50' : 'opacity-25'
        }`} />

        {/* Dark Overlay with Gradient */}
        <div className={`absolute inset-0 ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-black/10 via-black/20 to-black/40' 
            : 'bg-gradient-to-b from-black/20 via-black/30 to-black/60'
        }`} />

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        {/* Color Tint Overlay */}
        <div className={`absolute inset-0 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-red-900/10 via-transparent to-slate-900/30' 
            : 'bg-gradient-to-br from-red-900/20 via-transparent to-slate-900/40'
        }`} />

        {/* Content Overlay */}
        <div className="relative z-10 w-full h-full px-12 xl:px-16 py-8 flex flex-col justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 animate-fade-in">
            <img src="/images/mk.png" alt="Logo" className={`w-16 h-16 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border ${
              theme === 'dark' 
                ? 'border-red-500/30' 
                : 'border-red-500/50'
            }`} />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                <span>{t('auth.quizmaster')}</span>
                <span className="text-red-500">{t('auth.quizmasterBrand')}</span>
              </h1>
              <p className="text-slate-300 text-sm">{t('auth.gameSubtitle')}</p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <h2 className="text-6xl lg:text-7xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
                {t('auth.heroKnowledge')}
              </h2>
              <h3 className="text-6xl lg:text-7xl font-bold leading-tight mb-4 drop-shadow-lg">
                <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                  {t('auth.heroLeadership')}
                </span>
              </h3>
              <h4 className="text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                {t('auth.heroCommunity')}
              </h4>
              <div className="w-16 h-1.5 bg-gradient-to-r from-red-600 to-red-800 rounded-full mt-6 shadow-lg shadow-red-700/50" />
            </div>

            <p className="text-slate-100 text-lg lg:text-xl leading-relaxed max-w-lg drop-shadow-md">
              {t('auth.heroDescription')}
            </p>

            {/* Day Card */}
            <div className={`backdrop-blur-xl border rounded-2xl p-6 w-fit mt-8 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 group/card cursor-pointer group-hover/card:scale-105 transform ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-slate-900/70 to-slate-900/40 border-slate-700/50 hover:bg-slate-900/90' 
                : 'bg-gradient-to-br from-white/40 to-white/20 border-white/30 hover:bg-white/50'
            }`}>
              <div className={`flex items-center gap-2 mb-2 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                <Calendar size={18} className="group-hover/card:rotate-12 group-hover/card:scale-110 transition-all" />
                <span className="uppercase tracking-wider text-xs font-bold">{t('auth.today')}</span>
              </div>
              <h5 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>{getDayOfWeek()}</h5>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>{getFormattedDate()}</p>
            </div>
          </div>

          {/* Trust Badge */}
          <div className={`flex items-center gap-2 text-xs animate-fade-in ${
            theme === 'dark' ? 'text-slate-200' : 'text-slate-100'
          }`} style={{ animationDelay: '0.2s' }}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              theme === 'dark' ? 'bg-green-400' : 'bg-green-500'
            }`} />
            {t('auth.trustedBy')}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className={`flex-1 flex flex-col justify-center items-center p-8 relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}>
        {/* Wavy Pattern - Bottom Left */}
        <div className={`absolute bottom-0 left-0 w-96 h-96 pointer-events-none ${
          theme === 'dark' ? 'opacity-20' : 'opacity-10'
        }`}
          style={{
            backgroundImage: theme === 'dark'
              ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' stroke-width='0.5' opacity='0.6'%3E%3Cpath d='M10 50 Q 25 30, 40 50 T 70 50 T 100 50'/%3E%3Cpath d='M10 60 Q 25 40, 40 60 T 70 60 T 100 60'/%3E%3Cpath d='M10 70 Q 25 50, 40 70 T 70 70 T 100 70'/%3E%3Cpath d='M10 80 Q 25 60, 40 80 T 70 80 T 100 80'/%3E%3Cpath d='M10 90 Q 25 70, 40 90 T 70 90 T 100 90'/%3E%3Cpath d='M10 40 Q 25 20, 40 40 T 70 40 T 100 40'/%3E%3Cpath d='M10 30 Q 25 10, 40 30 T 70 30 T 100 30'/%3E%3C/g%3E%3C/svg%3E")`
              : `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23dc2626' stroke-width='0.5' opacity='0.4'%3E%3Cpath d='M10 50 Q 25 30, 40 50 T 70 50 T 100 50'/%3E%3Cpath d='M10 60 Q 25 40, 40 60 T 70 60 T 100 60'/%3E%3Cpath d='M10 70 Q 25 50, 40 70 T 70 70 T 100 70'/%3E%3Cpath d='M10 80 Q 25 60, 40 80 T 70 80 T 100 80'/%3E%3Cpath d='M10 90 Q 25 70, 40 90 T 70 90 T 100 90'/%3E%3Cpath d='M10 40 Q 25 20, 40 40 T 70 40 T 100 40'/%3E%3Cpath d='M10 30 Q 25 10, 40 30 T 70 30 T 100 30'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '400px 400px',
            backgroundPosition: '0 0',
          }}
        />

        {/* Dot Pattern - Right Side Fade */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none"
          style={{
            background: theme === 'dark'
              ? `radial-gradient(circle at 85% 50%, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.15) 25%, rgba(239, 68, 68, 0.05) 50%, transparent 100%)`
              : `radial-gradient(circle at 85% 50%, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 25%, rgba(239, 68, 68, 0.02) 50%, transparent 100%)`,
          }}
        />

        {/* Subtle Dot Grid - Right Side */}
        <div className={`absolute top-0 right-0 w-1/2 h-full pointer-events-none ${
          theme === 'dark' ? 'opacity-10' : 'opacity-5'
        }`}
          style={{
            backgroundImage: theme === 'dark'
              ? `radial-gradient(circle, rgba(239, 68, 68, 0.8) 1.5px, transparent 1.5px)`
              : `radial-gradient(circle, rgba(220, 38, 38, 0.6) 1.5px, transparent 1.5px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0',
          }}
        />

        {/* Gradient Overlay - Soft Red Glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: theme === 'dark'
              ? `linear-gradient(135deg, transparent 0%, transparent 40%, rgba(239, 68, 68, 0.05) 70%, rgba(239, 68, 68, 0.02) 100%)`
              : `linear-gradient(135deg, transparent 0%, transparent 40%, rgba(239, 68, 68, 0.03) 70%, rgba(239, 68, 68, 0.01) 100%)`,
          }}
        />

        {/* Floating Animation Elements */}
        <div className={`absolute top-20 right-20 w-32 h-32 rounded-full blur-3xl animate-float ${
          theme === 'dark' ? 'bg-red-500/3' : 'bg-red-500/1'
        }`} />
        <div className={`absolute bottom-20 left-20 w-40 h-40 rounded-full blur-3xl animate-float ${
          theme === 'dark' ? 'bg-blue-500/3' : 'bg-blue-500/1'
        }`} style={{ animationDelay: '2s' }} />

        {/* Top Header */}
        <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-8 z-10">
          <h2 className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>{t('auth.login')}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110 ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 hover:bg-slate-700 text-slate-300' 
                  : 'bg-slate-200/50 hover:bg-slate-300 text-slate-600'
              }`}
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className={`flex items-center gap-1.5 px-3 h-10 rounded-full transition-all duration-300 text-sm font-medium hover:scale-110 ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 hover:bg-slate-700 text-slate-300' 
                  : 'bg-slate-200/50 hover:bg-slate-300 text-slate-600'
              }`}
            >
              <Globe size={14} />
              {language === 'en' ? 'EN' : 'AM'}
            </button>
          </div>
        </div>

        {/* Login Card - Larger Width */}
        <div className="w-full max-w-[520px] relative z-20 animate-fade-in">
          {/* Welcome Section - Grouped */}
          <div className="mb-10 text-center">
            {/* Avatar with Glow */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-lg opacity-20 animate-pulse ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-red-600 to-red-800' 
                    : 'bg-gradient-to-r from-red-600 to-red-800'
                }`} />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center relative z-10 hover:scale-105 transition-transform border ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-600/30' 
                    : 'bg-gradient-to-br from-red-600/10 to-red-800/10 border-red-600/30'
                }`}>
                  <span className="text-3xl">👤</span>
                </div>
              </div>
            </div>

            {/* Header */}
            <h1 className={`text-3xl font-bold flex items-center justify-center gap-2 mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {t('auth.loginTitle')}
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {t('auth.email')}
              </label>
              <div className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-all duration-300 ${
                focusedField === 'email' 
                  ? (theme === 'dark' 
                      ? 'border-red-500/50 bg-slate-800/80 shadow-lg shadow-red-500/10' 
                      : 'border-red-500/50 bg-white/80 shadow-lg shadow-red-500/10')
                  : (theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-red-500/30' 
                      : 'bg-white/50 border-slate-300 hover:border-red-500/30')
              }`}>
                <Mail className={`transition-colors ${
                  theme === 'dark' ? 'text-red-500/70' : 'text-red-600/70'
                }`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  placeholder={t('auth.enterEmail')}
                  className={`w-full bg-transparent outline-none text-sm ${
                    theme === 'dark' 
                      ? 'text-white placeholder:text-slate-500' 
                      : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {t('auth.password')}
              </label>
              <div className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-all duration-300 ${
                focusedField === 'password' 
                  ? (theme === 'dark' 
                      ? 'border-red-500/50 bg-slate-800/80 shadow-lg shadow-red-500/10' 
                      : 'border-red-500/50 bg-white/80 shadow-lg shadow-red-500/10')
                  : (theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-red-500/30' 
                      : 'bg-white/50 border-slate-300 hover:border-red-500/30')
              }`}>
                <Lock className={`transition-colors ${
                  theme === 'dark' ? 'text-red-500/70' : 'text-red-600/70'
                }`} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  placeholder={t('auth.enterPassword')}
                  className={`w-full bg-transparent outline-none text-sm ${
                    theme === 'dark' 
                      ? 'text-white placeholder:text-slate-500' 
                      : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`transition-colors ${
                    theme === 'dark' 
                      ? 'text-slate-500 hover:text-slate-300' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-lg animate-pulse ${
                theme === 'dark' 
                  ? 'bg-red-500/10 border border-red-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>{error}</p>
              </div>
            )}

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className={`flex items-center gap-2 cursor-pointer group ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className={`w-4 h-4 rounded accent-red-500 cursor-pointer ${
                    theme === 'dark' 
                      ? 'border border-slate-600 bg-slate-800' 
                      : 'border border-slate-400 bg-white'
                  }`}
                />
                <span className={`group-hover:opacity-80 transition ${
                  theme === 'dark' ? 'group-hover:text-slate-300' : 'group-hover:text-slate-700'
                }`}>
                  {t('auth.rememberMe')}
                </span>
              </label>
              <a href="#" className={`font-semibold transition ${
                theme === 'dark' 
                  ? 'text-red-500 hover:text-red-400' 
                  : 'text-red-600 hover:text-red-700'
              }`}>
                {t('auth.forgotPassword')}
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-14 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 group relative overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 hover:shadow-lg hover:shadow-red-700/50'
                  : 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 hover:shadow-lg hover:shadow-red-700/30'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-500" />
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative">{t('auth.loginButton')}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform relative" />
                </>
              )}
            </button>

            {/* Security Note */}
            <p className={`text-center text-xs mt-6 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
            }`}>
              {/* 🔒 {t('auth.secureConnection')} */}
            </p>
          </form>
        </div>
      </div>

      {/* Animated Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
