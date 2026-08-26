'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignScreenProps {
  question: {
    id: string;
    question_text: string;
    time_limit: number;
  };
  onTimeUp: () => void;
  onBack?: () => void;
  minimumTime: number;  // ← Add this prop (from database)
}

export function SignScreen({ question, onTimeUp, onBack, minimumTime }: SignScreenProps) {
  const [timeLeft, setTimeLeft] = useState(question.time_limit);
  const [isComplete, setIsComplete] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    // Only run timer if it has been started
    if (!timerStarted || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Play alarm when minimum_time_frame seconds remain (from database-driven minimumTime prop)
        if (newTime === minimumTime) {  // ← Use database-driven minimumTime
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              console.error('Audio playback failed:', error);
            });
          }
        }

        if (newTime <= 0) {
          setIsComplete(true);
          onTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerStarted, isComplete, onTimeUp, minimumTime]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercent = ((question.time_limit - timeLeft) / question.time_limit) * 100;
  
  // Determine if time is running out (based on database-driven minimumTime)
  const isTimeWarning = timeLeft <= minimumTime && timeLeft > 0;
  const isTimeUp = timeLeft === 0;

  // Color theme
  const bgColor = isDarkMode ? '#1a1a1a' : '#f0eeea';
  const cardBg = isDarkMode ? '#ffffff' : '#ffffff';
  const textColor = isDarkMode ? '#1a1a1a' : '#1a1a1a';
  const accentColor = '#c0392b';
  const darkAccent = '#7B0000';

  const handleStartTimer = () => {
    setTimerStarted(true);
  };

  const handleResetTimer = () => {
    setTimeLeft(question.time_limit);
    setIsComplete(false);
    setTimerStarted(false);  // Stop the timer, don't restart
  };

  return (
    <div
      style={{
        background: bgColor,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Main Card - Contains everything */}
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          background: cardBg,
          borderRadius: '32px',
          padding: '80px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '60px',
        }}
      >
        {/* Top Section: Logos and Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Left Logo - Clickable Back Button */}
          <div
            onClick={() => {
              setTimerStarted(false);
              setTimeLeft(question.time_limit);
              setIsComplete(false);
              // Call the onBack callback
              if (onBack) {
                onBack();
              }
            }}
            style={{
              flex: '0 0 120px',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.9,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
            title="Back to questions"
          >
            <img 
              src="/images/mk.png" 
              alt="MK Logo - Back" 
              style={{
                height: '100%',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Timer - Center - Clickable to Start */}
          <div
            onClick={!timerStarted ? handleStartTimer : undefined}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              cursor: !timerStarted ? 'pointer' : 'default',
            }}
          >
            {/* Timer Circle */}
            <div
              style={{
                position: 'relative',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: `3px solid ${isTimeWarning || isTimeUp ? darkAccent : accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                background: 'transparent',
                animation: timerStarted && !isComplete
                  ? 'pulse 1.5s ease-out infinite'
                  : 'none',
              }}
            >
              🕐
            </div>

            {/* Time Display - Red */}
            <div
              style={{
                fontSize: '72px',
                fontWeight: '700',
                color: isTimeWarning || isTimeUp ? darkAccent : accentColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1',
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Right Logo */}
          <div
            style={{
              flex: '0 0 120px',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !timerStarted ? 'pointer' : 'default',
            }}
            onClick={!timerStarted ? handleStartTimer : undefined}
          >
            <img 
              src="/images/logo.jpg" 
              alt="Logo" 
              style={{
                height: '100%',
                width: 'auto',
                objectFit: 'contain',
                opacity: !timerStarted ? 0.8 : 1,
                transition: 'opacity 0.2s',
              }}
            />
          </div>
        </div>

        {/* Question Text - Center */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '48px',
          }}
        >
          <h1
            style={{
              fontSize: question.question_text.length > 200 ? '80px' : question.question_text.length > 100 ? '100px' : '120px',
              fontWeight: '600',
              color: textColor,
              lineHeight: '1.6',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {question.question_text}
          </h1>
        </div>

        {/* Progress Bar - Bottom */}
        <div
          style={{
            width: '100%',
            background: '#e0e0e0',
            borderRadius: '6px',
            overflow: 'hidden',
            height: '8px',
          }}
        >
          <div
            style={{
              height: '100%',
              background: isTimeWarning || isTimeUp ? darkAccent : accentColor,
              width: timerStarted ? `${progressPercent}%` : '0%',
              transition: 'width 1s linear',
              borderRadius: '6px',
            }}
          />
        </div>

        {/* Reset Timer Button - Inside Card at Bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <button
            onClick={handleResetTimer}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 8px',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#ccc' : '#d0d0d0'}`,
              background: '#ffffff',
              color: textColor,
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
              width: '40px',
              height: '40px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDarkMode ? '#f5f5f5' : '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Reset timer"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
      `}</style>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src="/audio/alarm.wav" />
    </div>
  );
}
