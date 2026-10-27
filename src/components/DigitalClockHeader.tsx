import React, { useState, useEffect } from 'react';
import { Clock, Bell, Volume2, Sparkles } from 'lucide-react';
import { Alarm, Language } from '../types';
import { translations } from '../translations';
import { formatTimeRemaining, formatTo12Hour, getEarliestNextAlarm } from '../utils/timeUtils';

interface DigitalClockHeaderProps {
  alarms: Alarm[];
  lang: Language;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onOpenNewAlarm: () => void;
}

export const DigitalClockHeader: React.FC<DigitalClockHeaderProps> = ({
  alarms,
  lang,
  isAudioUnlocked,
  onUnlockAudio,
  onOpenNewAlarm,
}) => {
  const [now, setNow] = useState(new Date());
  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const earliest = getEarliestNextAlarm(alarms, now);

  // Time components
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hoursStr = hours.toString().padStart(2, '0');

  // Format date
  const dateFormatted = now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141a29]/90 to-[#0c101c]/90 border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Audio Unlock Alert Banner (Crucial for mobile phones) */}
      {!isAudioUnlocked && (
        <div
          onClick={onUnlockAudio}
          role="button"
          tabIndex={0}
          className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 cursor-pointer active:scale-98 transition-all hover:bg-amber-500/20"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-500/30 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-amber-300 animate-bounce" />
            </div>
            <p className="text-xs font-semibold leading-tight">
              {t.tapToEnableAudio}
            </p>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-400 text-slate-950 shrink-0">
            {lang === 'hi' ? 'चालू करें' : 'Enable'}
          </span>
        </div>
      )}

      {/* Main Clock Face */}
      <div className="text-center py-2">
        <div className="inline-flex items-baseline justify-center font-mono font-bold tracking-tight select-none">
          {/* Hour */}
          <span className="text-5xl sm:text-6xl text-white font-extrabold drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
            {hoursStr}
          </span>
          {/* Colon */}
          <span className="text-4xl sm:text-5xl text-amber-400 mx-1 animate-pulse">
            :
          </span>
          {/* Minute */}
          <span className="text-5xl sm:text-6xl text-white font-extrabold drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
            {minutes}
          </span>
          {/* Seconds & Period column */}
          <div className="flex flex-col items-start ml-2 text-left self-center">
            <span className="text-xs sm:text-sm font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md">
              {period}
            </span>
            <span className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
              :{seconds}
            </span>
          </div>
        </div>

        {/* Date Display */}
        <p className="mt-2 text-xs sm:text-sm font-medium text-slate-400 capitalize">
          {dateFormatted}
        </p>
      </div>

      {/* Upcoming Alarm Banner */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        {earliest ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {formatTo12Hour(earliest.alarm.time).time} {formatTo12Hour(earliest.alarm.time).period}
                {earliest.alarm.label ? ` • ${earliest.alarm.label}` : ''}
              </p>
              <p className="text-[11px] text-amber-400 font-medium truncate">
                {t.nextAlarmIn} {formatTimeRemaining(earliest.date, now, lang)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs">{t.noAlarmsSet}</span>
          </div>
        )}

        <button
          onClick={onOpenNewAlarm}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? '+ अलार्म' : '+ Set Alarm'}</span>
        </button>
      </div>
    </div>
  );
};
