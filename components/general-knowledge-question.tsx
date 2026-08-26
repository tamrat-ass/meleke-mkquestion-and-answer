'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface GeneralKnowledgeQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  onBack?: () => void;
  onTimerClick?: () => void;
  onNextQuestion?: () => void;
  timeLeft: number;
  totalTime?: number;
  minimumTime: number;  // ← Now required (from database)
}

export function GeneralKnowledgeQuestion({
  questionNumber,
  totalQuestions,
  question,
  onBack,
  onTimerClick,
  onNextQuestion,
  timeLeft,
  minimumTime,  // ← No default, must be passed
}: GeneralKnowledgeQuestionProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [alarmPlayed, setAlarmPlayed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Play alarm when time reaches minimum threshold
  useEffect(() => {
    if (mounted && timeLeft <= minimumTime && timeLeft > 0 && !alarmPlayed) {
      playAlarm();
      setAlarmPlayed(true);
    } else if (timeLeft > minimumTime) {
      // Reset the alarm flag when time goes back above minimum
      setAlarmPlayed(false);
    }
  }, [timeLeft, minimumTime, alarmPlayed, mounted]);

  const playAlarm = () => {
    try {
      const audio = new Audio('/audio/alarm.wav');
      audio.play().catch(err => console.error('Failed to play alarm:', err));
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  };

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

      {/* Timer - Between the two logos */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 md:px-10 py-2 md:py-3 text-white text-2xl md:text-3xl font-bold shadow-xl flex items-center gap-2">
          <div className="text-lg"> </div>
          {timeDisplay}
        </div>
      </div>

      <img
        src="/images/logo.jpg"
        alt="logo"
        className="absolute top-4 right-4 w-12 md:w-16 h-auto object-contain hover:scale-110 transition-transform duration-300 cursor-pointer"
        onClick={() => onTimerClick?.()}
      />

      <div className="w-full max-w-5xl relative z-10 pt-20 md:pt-24 lg:pt-28">
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

        {/* Main Card */}
        <div className="bg-white rounded-3xl md:rounded-3xl shadow-2xl p-8 md:p-14 lg:p-16 flex flex-col justify-between items-center min-h-96 md:min-h-[500px] lg:min-h-[600px]">
          {timeLeft === 0 ? (
            // Time is Up Card
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              <div className="text-center">
                <h2 className="text-7xl md:text-8xl lg:text-9xl font-bold text-red-600 mb-8 animate-bounce">
                
                </h2>
                <p className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 mb-4 animate-pulse">
                  {t('game.timeUp')}
                </p>
                <div className="mt-8 flex justify-center gap-2">
                  <span className="text-3xl animate-pulse" style={{ animationDelay: '0s' }}> </span>
                  <span className="text-3xl animate-pulse" style={{ animationDelay: '0.2s' }}> </span>
                  <span className="text-3xl animate-pulse" style={{ animationDelay: '0.4s' }}> </span>
                </div>
              </div>
            </div>
          ) : (
            // Question Display
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              {/* Question Text - Centered for General Knowledge */}
              <h1 className="text-center text-7xl md:text-8xl lg:text-9xl font-bold text-gray-900 leading-tight">
                {question}
              </h1>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between w-full pt-12 md:pt-16 flex-wrap">
            {/* Reset Timer Button - Left Side */}
            <button
              onClick={() => {
                // Reset timer without starting it
                onBack?.();
              }}
              className="text-gray-400 hover:text-gray-500 opacity-40 hover:opacity-60 transition-all duration-300 flex items-center justify-center"
              title="Reset"
            >
              <RotateCcw className="h-5 md:h-6 w-5 md:w-6" />
            </button>

            {/* Next Question Button - Right Side */}
            <button
              onClick={() => onNextQuestion?.()}
              className="text-gray-400 hover:text-gray-500 opacity-40 hover:opacity-60 transition-all duration-300 flex items-center justify-center"
              title="Next Question"
            >
              <ChevronRight className="h-5 md:h-6 w-5 md:w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
