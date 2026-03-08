'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
      console.error('[v0] Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#06b6d4' }}
            title={`Switch to ${language === 'en' ? 'Amharic' : 'English'}`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'AM'}</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{ background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t('auth.quizmaster')}
          </h1>
          <p style={{ color: '#9ca3af' }} className="text-lg">
            {t('auth.gameplatform')}
          </p>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155' }} className="rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">{t('auth.loginTitle')}</h2>
          <p style={{ color: '#9ca3af' }} className="text-sm mb-6">
            {t('auth.loginSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300 block">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t('auth.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{ background: '#0f172a', borderColor: '#475569', color: '#f1f5f9' }}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300 block">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{ background: '#0f172a', borderColor: '#475569', color: '#f1f5f9' }}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {error && (
              <div style={{ background: '#7f1d1d', borderColor: '#991b1b', color: '#fca5a5' }} className="border px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)' }}
              className="w-full text-white font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? `${t('common.loading')}...` : t('auth.loginButton')}
            </button>
          </form>

          <div style={{ borderTopColor: '#334155' }} className="mt-6 pt-6 border-t text-center space-y-4">
          </div>
        </div>

        <div className="text-center mt-8 space-y-1">
          <p style={{ color: '#6b7280' }} className="text-xs">
           
          </p>
          <p style={{ color: '#9ca3af' }} className="text-xs font-mono">
           
          </p>
        </div>
      </div>
    </div>
  );
}
