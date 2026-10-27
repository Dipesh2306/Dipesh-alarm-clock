import React from 'react';
import { Bell, Moon, Sun, Smartphone, HelpCircle, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  isWakeLockActive: boolean;
  onToggleWakeLock: () => void;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onOpenBedside: () => void;
  onOpenTips: () => void;
  onTriggerTestAlarm: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  isWakeLockActive,
  onToggleWakeLock,
  isAudioUnlocked,
  onUnlockAudio,
  onOpenBedside,
  onOpenTips,
  onTriggerTestAlarm,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-30 bg-[#07090e]/85 backdrop-blur-md border-b border-white/5 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Bell className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
              {t.appName}
            </h1>
            <p className="text-[11px] text-amber-400/90 font-medium tracking-wide">
              {lang === 'hi' ? 'स्मार्ट अलार्म और क्लॉक' : 'Smart Clock & Alarms'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio status indicator */}
          {!isAudioUnlocked && (
            <button
              onClick={onUnlockAudio}
              title={t.tapToEnableAudio}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full animate-pulse hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[11px]">Audio Tap</span>
            </button>
          )}

          {/* Test Alarm Immediate trigger */}
          <button
            onClick={onTriggerTestAlarm}
            title={lang === 'hi' ? 'तुरंत टेस्ट अलार्म बजाएँ' : 'Test Ring Alarm Now'}
            className="p-2 text-xs font-medium text-slate-300 hover:text-amber-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </button>

          {/* Screen Wake Lock */}
          <button
            onClick={onToggleWakeLock}
            title={isWakeLockActive ? t.wakeLockActive : t.wakeLockInactive}
            className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
              isWakeLockActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <Sun className={`w-4 h-4 ${isWakeLockActive ? 'text-emerald-400' : 'text-slate-400'}`} />
          </button>

          {/* Bedside Mode */}
          <button
            onClick={onOpenBedside}
            title={t.nightstandMode}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Tips button */}
          <button
            onClick={onOpenTips}
            title="Mobile Settings Guide"
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1 text-xs font-bold rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer"
          >
            {lang === 'hi' ? 'EN' : 'हिंदी'}
          </button>
        </div>
      </div>
    </header>
  );
};
