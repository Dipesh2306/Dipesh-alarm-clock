import React, { useState, useEffect } from 'react';
import { Bell, Clock, BrainCircuit, CheckCircle, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Alarm, Language, MathChallenge } from '../types';
import { translations } from '../translations';
import { generateMathChallenge } from '../utils/timeUtils';
import { soundEngine } from '../services/soundEngine';
import { vibrationService } from '../services/vibrationService';

interface ActiveAlarmScreenProps {
  alarm: Alarm;
  lang: Language;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const ActiveAlarmScreen: React.FC<ActiveAlarmScreenProps> = ({
  alarm,
  lang,
  onDismiss,
  onSnooze,
}) => {
  const t = translations[lang];
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mission states
  const [mathChallenge, setMathChallenge] = useState<MathChallenge | null>(null);
  const [mathSolved, setMathSolved] = useState<boolean>(false);
  const [tapCount, setTapCount] = useState<number>(0);
  const [shakeError, setShakeError] = useState<boolean>(false);

  // Start sound and vibration when mounted
  useEffect(() => {
    soundEngine.playTone(alarm.sound, alarm.volume, alarm.gentleWake);
    if (alarm.vibrate) {
      vibrationService.startAlarmVibration();
    }

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // If alarm has math mission, generate challenge
    if (alarm.mission.startsWith('math-')) {
      setMathChallenge(generateMathChallenge(alarm.mission));
    }

    return () => {
      clearInterval(clockTimer);
      soundEngine.stopTone();
      vibrationService.stopAlarmVibration();
    };
  }, [alarm]);

  const handleDismissSuccess = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
    soundEngine.stopTone();
    vibrationService.stopAlarmVibration();
    onDismiss();
  };

  const handleSelectMathOption = (selected: number) => {
    if (!mathChallenge) return;
    if (selected === mathChallenge.answer) {
      setMathSolved(true);
      setTimeout(() => {
        handleDismissSuccess();
      }, 500);
    } else {
      setShakeError(true);
      vibrationService.vibrateBrief(120);
      setTimeout(() => setShakeError(false), 600);
      // Generate new challenge so user can't just guess randomly
      setMathChallenge(generateMathChallenge(alarm.mission));
    }
  };

  const handleTapChallenge = () => {
    vibrationService.vibrateBrief(50);
    const nextCount = tapCount + 1;
    setTapCount(nextCount);
    if (nextCount >= 5) {
      handleDismissSuccess();
    }
  };

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#07080f] text-white p-6 sm:p-10 select-none overflow-y-auto">
      {/* Background Animated Pulses */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-500/20 rounded-full blur-[90px] animate-pulse delay-500" />
      </div>

      {/* Top Bar: Alarm Ringing Notification */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs uppercase tracking-widest animate-pulse">
          <Bell className="w-4 h-4 animate-bounce" />
          <span>{t.ringingNow}</span>
        </div>
      </div>

      {/* Middle: Giant Luminous Clock & Alarm Label */}
      <div className="relative z-10 text-center my-auto py-6">
        <div className="font-mono text-6xl sm:text-8xl font-black tracking-tight drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          <span>{hours}</span>
          <span className="text-amber-400 mx-1">:</span>
          <span>{minutes}</span>
          <span className="text-2xl sm:text-3xl text-slate-400 ml-2 font-normal font-sans">
            :{seconds}
          </span>
        </div>

        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white max-w-md mx-auto">
          {alarm.label || (lang === 'hi' ? 'उठने का समय हो गया!' : 'Time to wake up!')}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {alarm.snoozeDurationMinutes} {lang === 'hi' ? 'मिनट स्नूज़ उपलब्ध है' : 'min snooze available'}
        </p>

        {/* Mission Screen if Math Challenge is active */}
        {alarm.mission.startsWith('math-') && mathChallenge && (
          <div className={`mt-6 max-w-sm mx-auto bg-[#131929]/90 border border-purple-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-md transition-transform ${
            shakeError ? 'animate-shake' : ''
          }`}>
            <div className="flex items-center justify-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
              <BrainCircuit className="w-4 h-4" />
              <span>{t.solveToDismiss}</span>
            </div>

            <div className="text-3xl font-mono font-black text-amber-300 my-3">
              {mathChallenge.question}
            </div>

            {mathSolved ? (
              <div className="text-emerald-400 font-bold flex items-center justify-center gap-2 py-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t.correctAnswer}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {mathChallenge.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectMathOption(opt)}
                    className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-purple-600/40 active:scale-95 text-xl font-mono font-bold border border-white/10 hover:border-purple-400 transition-all cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mission Screen if 5 Fast Taps is active */}
        {alarm.mission === 'tap-challenge' && (
          <div className="mt-6 max-w-xs mx-auto">
            <p className="text-xs text-amber-300 font-bold mb-3">{t.tapRapidly}</p>
            <button
              onClick={handleTapChallenge}
              className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 text-white font-mono font-black text-2xl flex flex-col items-center justify-center border-4 border-white/20 active:scale-90 shadow-2xl shadow-purple-500/30 transition-transform cursor-pointer"
            >
              <span>{tapCount} / 5</span>
              <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-white/80">TAP!</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls: Dismiss & Snooze */}
      <div className="relative z-10 max-w-md w-full mx-auto space-y-3 pt-4">
        {/* If no math mission or mission already solved, show primary Dismiss button */}
        {(alarm.mission === 'none' || mathSolved) && (
          <button
            onClick={handleDismissSuccess}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-lg tracking-wide shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-6 h-6" />
            <span>{t.dismiss}</span>
          </button>
        )}

        {/* Snooze Button */}
        <button
          onClick={() => onSnooze(alarm.snoozeDurationMinutes)}
          className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-sm border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>
            {t.snooze} ({alarm.snoozeDurationMinutes} {lang === 'hi' ? 'मिनट' : 'mins'})
          </span>
        </button>
      </div>
    </div>
  );
};
