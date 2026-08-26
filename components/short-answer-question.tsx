'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/i18n/context';
import { BookOpen } from 'lucide-react';

interface ShortAnswerQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  answer?: string;
  showResult?: boolean;
  onBack?: () => void;
  onTimerClick?: () => void;
  onShowAnswer?: () => void;
  timeLeft: number;
  totalTime: number;
  minimumTime: number;  // ← Add this prop (from database)
}

export function ShortAnswerQuestion({
  questionNumber,
  totalQuestions,
  question,
  answer,
  showResult,
  onBack,
  onTimerClick,
  onShowAnswer,
  timeLeft,
  totalTime,
  minimumTime,  // ← Add this parameter
}: ShortAnswerQuestionProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

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
      className={`min-h-screen flex flex-col items-center justify-start p-4 md:p-6 relative overflow-hidden ${
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
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
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

      <div className="w-full max-w-5xl relative z-10 pt-20 md:pt-24 lg:pt-28">
        {/* Main Card */}
        <div className="bg-white rounded-3xl md:rounded-3xl shadow-2xl p-8 md:p-14 lg:p-16">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6 md:mb-8 flex-wrap">
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

          {/* Answer Display Box - Show when result is displayed */}
          {showResult && answer && (
            <div className="text-center">
              {/* Answer Content Box */}
              <div className="bg-white border-2 border-green-300 rounded-xl p-6 md:p-8 lg:p-10 text-left">
                <div className="text-lg md:text-2xl lg:text-3xl text-green-800 whitespace-pre-wrap break-words leading-loose md:leading-relaxed">
                  {answer}
                </div>
              </div>
            </div>
          )}

          {/* View Answer Button - Show when not displaying result */}
          {!showResult && (
            <div className="flex justify-start mt-8 md:mt-12">
              <button
                onClick={() => onShowAnswer?.()}
                className="text-gray-400 hover:text-gray-500 transition-all duration-300 hover:scale-110 flex items-center justify-center opacity-50 hover:opacity-70"
                title="View Answer"
              >
                <BookOpen className="h-6 md:h-8 w-6 md:w-8" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
