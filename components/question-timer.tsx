'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface QuestionTimerProps {
  timeLeft: number;
  totalTime: number;
  minimumTime?: number;
  isActive: boolean;
  isDarkMode?: boolean;
}

export function QuestionTimer({
  timeLeft,
  totalTime,
  minimumTime = 5,
  isActive,
  isDarkMode = false
}: QuestionTimerProps) {
  const { t } = useLanguage();
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  // Determine if time is running out
  const isTimeWarning = timeLeft <= minimumTime && timeLeft > 0 && isActive;
  const isTimeUp = timeLeft === 0;

  // Color theme
  const accentColor = '#c0392b';
  const darkAccent = '#7B0000';

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Timer Circle
      <div
        className="relative w-24 h-24 rounded-full border-4 flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: isTimeWarning || isTimeUp ? darkAccent : accentColor,
          animation: isActive && !isTimeUp ? 'pulse 1.5s ease-out infinite' : 'none',
        }}
      >
        <Clock
          size={40}
          style={{ color: isTimeWarning || isTimeUp ? darkAccent : accentColor }}
        />
      </div> */}

      {/* Time Display */}
      <div
        className="text-6xl font-bold font-mono"
        style={{
          color: isTimeWarning || isTimeUp ? darkAccent : accentColor,
        }}
      >
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-full bg-gray-300 rounded-lg overflow-hidden h-2">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: isActive ? `${progressPercent}%` : '0%',
              backgroundColor: isTimeWarning || isTimeUp ? darkAccent : accentColor,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {isActive ? t('game.timeRunning') : t('game.clickToStartTimer')}
        </p>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
