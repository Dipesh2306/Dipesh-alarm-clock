import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Bell, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { soundEngine } from '../services/soundEngine';
import { vibrationService } from '../services/vibrationService';

interface TimerViewProps {
  lang: Language;
}

export const TimerView: React.FC<TimerViewProps> = ({ lang }) => {
  const t = translations[lang];

  // Default: 5 minutes (300 seconds)
  const [totalSeconds, setTotalSeconds] = useState<number>(300);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Custom inputs
  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [customSeconds, setCustomSeconds] = useState<number>(0);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            soundEngine.playTone('radar-pulse', 0.9, false);
            vibrationService.startAlarmVibration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    soundEngine.unlockAudio();
    setIsFinished(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    soundEngine.stopTone();
    vibrationService.stopAlarmVibration();
    setSecondsLeft(totalSeconds);
  };

  const handleSetPreset = (seconds: number) => {
    setIsRunning(false);
    setIsFinished(false);
    soundEngine.stopTone();
    vibrationService.stopAlarmVibration();
    setTotalSeconds(seconds);
    setSecondsLeft(seconds);
  };

  const handleApplyCustom = () => {
    const sec = customMinutes * 60 + customSeconds;
    if (sec > 0) {
      handleSetPreset(sec);
    }
  };

  const handleDismissFinished = () => {
    setIsFinished(false);
    soundEngine.stopTone();
    vibrationService.stopAlarmVibration();
    setSecondsLeft(totalSeconds);
  };

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const s = (secondsLeft % 60).toString().padStart(2, '0');

  const presets = [
    { label: '1m Chai/Tea', sec: 60 },
    { label: '3m Noodles', sec: 180 },
    { label: '5m Quick Rest', sec: 300 },
    { label: '10m Power Nap', sec: 600 },
    { label: '15m Workout', sec: 900 },
    { label: '25m Pomodoro', sec: 1500 },
  ];

  return (
    <div className="space-y-6">
      {/* Timer Circular Display */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c101c] border border-white/10 p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center justify-center">
        {/* Ambient Ring Glow */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-white/5 stroke-current"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`stroke-current transition-all duration-300 ${
                isFinished ? 'text-rose-500 animate-pulse' : 'text-amber-400'
              }`}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Timer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 text-rose-400 animate-bounce" />
                <span className="text-xl font-bold text-rose-300">{t.timerFinished}</span>
                <button
                  onClick={handleDismissFinished}
                  className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/30 cursor-pointer"
                >
                  OK / Stop
                </button>
              </div>
            ) : (
              <>
                <div className="font-mono text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
                  {m}:{s}
                </div>
                <span className="text-xs text-slate-400 mt-1 font-medium">
                  {Math.round(progress)}% {lang === 'hi' ? 'बचा है' : 'remaining'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handleReset}
            title={t.reset}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Pause className="w-5 h-5 fill-amber-300" />
              <span>{t.pause}</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xl shadow-amber-500/25"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{t.start}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2.5">
          {t.timerPresets}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p.sec}
              onClick={() => handleSetPreset(p.sec)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                totalSeconds === p.sec
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#0f1422] border-white/5 text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-bold block">{p.label}</span>
              <span className="text-[11px] font-mono text-slate-400">
                {Math.floor(p.sec / 60)}m 00s
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Duration Input */}
      <div className="bg-[#0f1422] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-300">
          {t.customTimer}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#151c2e] px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
            <input
              type="number"
              min="0"
              max="99"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-10 bg-transparent text-white font-mono font-bold text-center outline-none"
            />
            <span className="text-slate-400">{t.minutes}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#151c2e] px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
            <input
              type="number"
              min="0"
              max="59"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-8 bg-transparent text-white font-mono font-bold text-center outline-none"
            />
            <span className="text-slate-400">{t.seconds}</span>
          </div>

          <button
            onClick={handleApplyCustom}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};
