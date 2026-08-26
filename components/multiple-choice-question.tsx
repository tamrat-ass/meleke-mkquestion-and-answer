'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/i18n/context';

interface MultipleChoiceQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: Array<{ key: string; value: string }>;
  timeLeft: number;
  totalTime: number;
  minimumTime: number;  // ← Add this prop (from database)
  onSelectAnswer: (selectedKey: string) => void;
  selectedAnswer?: string | null;
  correctAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
  onTimerClick?: () => void;
  onBack?: () => void;
}

const colorMap: Record<string, { bg: string; text: string; accent: string }> = {
  'A': { bg: 'bg-blue-50', text: 'text-blue-600', accent: 'bg-blue-100' },
  'B': { bg: 'bg-blue-50', text: 'text-blue-600', accent: 'bg-blue-100' },
  'C': { bg: 'bg-blue-50', text: 'text-blue-600', accent: 'bg-blue-100' },
  'D': { bg: 'bg-blue-50', text: 'text-blue-600', accent: 'bg-blue-100' },
};

export function MultipleChoiceQuestion({
  questionNumber,
  totalQuestions,
  question,
  options,
  timeLeft,
  totalTime,
  minimumTime,  // ← Add this parameter
  onSelectAnswer,
  selectedAnswer,
  correctAnswer,
  showResult,
  isCorrect,
  onTimerClick,
  onBack,
}: MultipleChoiceQuestionProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Helper function to get translated option label
  const getOptionLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      'A': t('game.labelA'),
      'B': t('game.labelB'),
      'C': t('game.labelC'),
      'D': t('game.labelD'),
    };
    return labelMap[key] || key;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Play alarm when timer reaches minimum time frame (from database-driven minimumTime prop)
  useEffect(() => {
    if (timeLeft === minimumTime && timeLeft > 0) {  // ← Use database-driven minimumTime
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error('Audio playback failed:', error);
        });
      }
    }
  }, [timeLeft, minimumTime]);

  if (!mounted) return null;

  const isDark = theme === 'dark';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate progress dots
  const progressDots = totalQuestions || 8;
  const currentProgress = questionNumber || 1;

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#4d0000] via-[#7a0000] to-[#3d0000]'
          : 'bg-gradient-to-br from-[#4d0000] via-[#7a0000] to-[#3d0000]'
      }`}
    >
      {/* Hidden audio element for alarm */}
      <audio ref={audioRef} src="/audio/alarm.wav" />

      {/* Red Wavy Pattern - Bottom Left */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' stroke-width='0.5' opacity='0.8'%3E%3Cpath d='M10 50 Q 25 30, 40 50 T 70 50 T 100 50'/%3E%3Cpath d='M10 60 Q 25 40, 40 60 T 70 60 T 100 60'/%3E%3Cpath d='M10 70 Q 25 50, 40 70 T 70 70 T 100 70'/%3E%3Cpath d='M10 80 Q 25 60, 40 80 T 70 80 T 100 80'/%3E%3Cpath d='M10 90 Q 25 70, 40 90 T 70 90 T 100 90'/%3E%3Cpath d='M10 40 Q 25 20, 40 40 T 70 40 T 100 40'/%3E%3Cpath d='M10 30 Q 25 10, 40 30 T 70 30 T 100 30'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
          backgroundPosition: '0 0',
        }}
      />

      {/* Dot Pattern - Right Side Fade */}
      <div
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 85% 50%, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 25%, rgba(239, 68, 68, 0.02) 50%, transparent 100%)`,
        }}
      />

      {/* Subtle Dot Grid - Right Side */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.6) 1.5px, transparent 1.5px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0',
        }}
      />
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-900/50 to-transparent" />
      </div>

      {/* Top Logos */}
      <img
        src="/images/mk.png"
        alt="logo"
        className="absolute top-4 left-4 w-12 md:w-16 h-auto object-contain hover:scale-110 transition-transform duration-300 cursor-pointer"
        onClick={() => onBack?.()}
      />
      
      {/* Timer - Between the two logos - Hide when answer is chosen */}
      {!showResult && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 md:px-10 py-2 md:py-3 text-white text-2xl md:text-3xl font-bold shadow-xl"
          >
            {timeDisplay}
          </div>
        </div>
      )}
      
      <img
        src="/images/logo.jpg"
        alt="logo"
        className="absolute top-4 right-4 w-12 md:w-16 h-auto object-contain hover:scale-110 transition-transform duration-300 cursor-pointer"
        onClick={() => onTimerClick?.()}
      />

      <div className="w-full max-w-5xl relative z-10 pt-12 md:pt-14">
        {/* Timer section removed - now at top between logos */}

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-3 md:mb-4 flex-wrap">
          {[...Array(progressDots)].map((_, i) => (
            <div
              key={i}
              className={`h-3 md:h-4 w-3 md:w-4 rounded-full transition-all duration-300 ${
                i === currentProgress - 1
                  ? 'bg-white ring-4 ring-red-300 scale-110'
                  : i < currentProgress - 1
                  ? 'bg-red-300'
                  : 'bg-red-500/60'
              }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl md:rounded-3xl shadow-2xl p-8 md:p-14 lg:p-16">
          {/* Question Number */}
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <div className="h-px bg-red-300 flex-1" />
            <div className="mx-4 md:mx-6 w-12 md:w-16 h-12 md:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center text-2xl md:text-2xl font-bold shadow-lg">
              {questionNumber}
            </div>
            <div className="h-px bg-red-300 flex-1" />
          </div>

          {/* Question Text */}
          <h1 className="text-center text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight">
            {question}
          </h1>

          {/* Answer Result Box - Show only when result is shown */}
          {showResult && (
            <div
              className={`border-2 rounded-2xl p-5 md:p-7 mb-4 md:mb-5 ${
                isCorrect
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="text-center">
                <div
                  className={`w-16 md:w-20 h-16 md:h-20 mx-auto mb-4 md:mb-5 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <span className="text-white text-3xl md:text-4xl">
                    {isCorrect ? '✓' : '✕'}
                  </span>
                </div>
                <h2
                  className={`text-2xl md:text-4xl font-bold mb-2 md:mb-3 ${
                    isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isCorrect ? t('game.correctAnswer') : t('game.wrongAnswer')}
                </h2>
                <p className="text-gray-600 text-sm md:text-lg mb-5 md:mb-6">
                  {isCorrect
                    ? t('game.wellDone')
                    : t('game.tryAgain')}
                </p>
                {correctAnswer && (
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg md:rounded-xl py-4 md:py-5 text-center">
                    <span className="text-lg md:text-2xl font-bold text-green-700">
                      {t('game.correct')}: {correctAnswer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Options Grid */}
          {!showResult && (
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
              {options.map((option) => {
                const color = colorMap[option.key] || colorMap['A'];
                const isSelected = selectedAnswer === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => onSelectAnswer(option.key)}
                    className={`relative group overflow-hidden rounded-lg md:rounded-xl p-4 md:p-6 transition-all duration-300 border-2 transform hover:scale-105 ${
                      isSelected
                        ? `${color.bg} border-2 border-gray-900/20 shadow-lg scale-105`
                        : `${color.bg} border-2 border-gray-200/30 hover:border-gray-400/50 shadow-md`
                    }`}
                  >
                    {/* Hover gradient */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent" />

                    <div className="relative z-10 flex items-start gap-3 md:gap-4">
                      {/* Letter Badge */}
                      <div
                        className={`flex-shrink-0 w-10 md:w-12 h-10 md:h-12 rounded-lg ${color.accent} flex items-center justify-center`}
                      >
                        <span className={`font-bold text-base md:text-xl ${color.text}`}>
                          {getOptionLabel(option.key)}.
                        </span>
                      </div>

                      {/* Option Text */}
                      <div className="flex-1 text-left">
                        <p className="text-gray-900 font-semibold text-sm md:text-lg lg:text-xl leading-snug">
                          {option.value}
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 md:top-4 md:right-4 w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs md:text-base">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
