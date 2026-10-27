import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Bell, ShieldCheck } from 'lucide-react';
import { Alarm, Language } from '../types';
import { translations } from '../translations';
import { formatTimeRemaining, formatTo12Hour, getEarliestNextAlarm } from '../utils/timeUtils';
import { wakeLockService } from '../services/wakeLockService';

interface BedsideClockViewProps {
  alarms: Alarm[];
  lang: Language;
  onClose: () => void;
}

export const BedsideClockView: React.FC<BedsideClockViewProps> = ({
  alarms,
  lang,
  onClose,
}) => {
  const [time, setTime] = useState(new Date());
  const [brightness, setBrightness] = useState<number>(0.7); // 0.1 to 1.0
  const [colorScheme, setColorScheme] = useState<'amber' | 'emerald' | 'cyan' | 'crimson'>('amber');
  const t = translations[lang];

  useEffect(() => {
    // Keep screen awake while in bedside mode
    wakeLockService.acquire();

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const earliest = getEarliestNextAlarm(alarms, time);

  let hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hoursStr = hours.toString().padStart(2, '0');

  const dateStr = time.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'amber':
        return {
          glow: 'drop-shadow-[0_0_35px_rgba(245,158,11,0.4)]',
          text: 'text-amber-400',
          accent: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        };
      case 'emerald':
        return {
          glow: 'drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]',
          text: 'text-emerald-400',
          accent: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        };
      case 'cyan':
        return {
          glow: 'drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]',
          text: 'text-cyan-400',
          accent: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
        };
      case 'crimson':
        return {
          glow: 'drop-shadow-[0_0_35px_rgba(239,68,68,0.3)]',
          text: 'text-rose-500',
          accent: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
        };
    }
  };

  const scheme = getColorClasses();

  return (
    <div
      style={{ opacity: brightness }}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none transition-opacity duration-300"
    >
      {/* Top Bar with Nightstand controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Brightness control */}
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10">
            <Moon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              className="w-20 sm:w-28 accent-amber-400 cursor-pointer"
            />
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </div>

          {/* Color Scheme Picker */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            {(['amber', 'emerald', 'cyan', 'crimson'] as const).map((col) => (
              <button
                key={col}
                onClick={() => setColorScheme(col)}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                  col === 'amber'
                    ? 'bg-amber-400'
                    : col === 'emerald'
                    ? 'bg-emerald-400'
                    : col === 'cyan'
                    ? 'bg-cyan-400'
                    : 'bg-rose-500'
                } ${colorScheme === col ? 'scale-125 ring-2 ring-white' : 'opacity-60'}`}
              />
            ))}
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>{t.exitNightstand}</span>
        </button>
      </div>

      {/* Center Giant Luminous Clock */}
      <div className="text-center my-auto">
        <div className={`font-mono font-black text-7xl sm:text-9xl tracking-tight ${scheme.text} ${scheme.glow}`}>
          <span>{hoursStr}</span>
          <span className="mx-1 animate-pulse">:</span>
          <span>{minutes}</span>
        </div>

        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="text-xl sm:text-2xl font-mono text-slate-400">
            :{seconds}
          </span>
          <span className="text-sm sm:text-base font-bold font-mono px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-slate-300">
            {period}
          </span>
        </div>

        <p className="mt-4 text-base sm:text-lg font-medium text-slate-400">
          {dateStr}
        </p>
      </div>

      {/* Bottom: Next Alarm Banner */}
      <div className="max-w-md mx-auto w-full text-center">
        {earliest ? (
          <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border ${scheme.accent}`}>
            <Bell className="w-4 h-4 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold">
              {formatTo12Hour(earliest.alarm.time).time} {formatTo12Hour(earliest.alarm.time).period}
              {' • '}
              {formatTimeRemaining(earliest.date, time, lang)}
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {t.noAlarmsSet}
          </p>
        )}
      </div>
    </div>
  );
};
