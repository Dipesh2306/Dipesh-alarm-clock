import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Hourglass, Timer, Plus, ShieldAlert, Sparkles, Moon } from 'lucide-react';
import { ActiveTab, Alarm, Language } from './types';
import { translations } from './translations';
import { loadAlarms, saveAlarms, loadLanguage, saveLanguage } from './services/alarmStorage';
import { soundEngine } from './services/soundEngine';
import { vibrationService } from './services/vibrationService';
import { wakeLockService } from './services/wakeLockService';
import { notificationService } from './services/notificationService';
import { getNextAlarmOccurrence } from './utils/timeUtils';

import { Navbar } from './components/Navbar';
import { DigitalClockHeader } from './components/DigitalClockHeader';
import { AlarmList } from './components/AlarmList';
import { AlarmModal } from './components/AlarmModal';
import { ActiveAlarmScreen } from './components/ActiveAlarmScreen';
import { BedsideClockView } from './components/BedsideClockView';
import { TimerView } from './components/TimerView';
import { StopwatchView } from './components/StopwatchView';
import { MobileTipsModal } from './components/MobileTipsModal';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadAlarms());
  const [lang, setLang] = useState<Language>(() => loadLanguage());
  const [activeTab, setActiveTab] = useState<ActiveTab>('alarms');

  // Modal states
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState<boolean>(false);
  const [selectedAlarmForEdit, setSelectedAlarmForEdit] = useState<Alarm | null>(null);
  const [isBedsideOpen, setIsBedsideOpen] = useState<boolean>(false);
  const [isTipsOpen, setIsTipsOpen] = useState<boolean>(false);

  // Active Ringing Alarm state
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);

  // Wake lock and Audio status
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);

  // Track the last minute fired to avoid multiple triggers within the same minute
  const lastFiredMinuteRef = useRef<{ [alarmId: string]: string }>({});

  const t = translations[lang];

  // Save alarms whenever they change
  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  // Save language changes
  const handleToggleLang = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
    saveLanguage(nextLang);
  };

  // Subscribe to wake lock changes
  useEffect(() => {
    const unsubscribe = wakeLockService.subscribe((active) => {
      setIsWakeLockActive(active);
    });
    return unsubscribe;
  }, []);

  const handleToggleWakeLock = async () => {
    await wakeLockService.toggle();
  };

  // Global touch / click listener to unlock audio seamlessly on first mobile user interaction
  const handleUnlockAudio = () => {
    const ok = soundEngine.unlockAudio();
    if (ok) {
      setIsAudioUnlocked(true);
    }
  };

  useEffect(() => {
    const onUserGesture = () => {
      handleUnlockAudio();
    };
    window.addEventListener('click', onUserGesture, { once: true });
    window.addEventListener('touchstart', onUserGesture, { once: true });
    return () => {
      window.removeEventListener('click', onUserGesture);
      window.removeEventListener('touchstart', onUserGesture);
    };
  }, []);

  // Check Alarms every 1 second
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentSecond = now.getSeconds();
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay();
      const minuteKey = `${now.toDateString()}_${currentTimeString}`;

      // Only evaluate during the first 3 seconds of a minute
      if (currentSecond <= 3) {
        for (const alarm of alarms) {
          if (!alarm.isEnabled) continue;

          // Check if already fired for this minute
          if (lastFiredMinuteRef.current[alarm.id] === minuteKey) {
            continue;
          }

          // Check if alarm is scheduled for this time
          const [alarmH, alarmM] = alarm.time.split(':');
          const isTimeMatch =
            parseInt(alarmH, 10) === now.getHours() &&
            parseInt(alarmM, 10) === now.getMinutes();

          if (!isTimeMatch) continue;

          // Check day repetition match
          const isRepeatMatch =
            !alarm.days ||
            alarm.days.length === 0 || // Once
            alarm.days.includes(currentDay as any);

          if (isRepeatMatch) {
            lastFiredMinuteRef.current[alarm.id] = minuteKey;
            triggerAlarm(alarm);

            // If it was a "Once" alarm (empty days array), auto-disable it after firing
            if (!alarm.days || alarm.days.length === 0) {
              setAlarms((prev) =>
                prev.map((a) => (a.id === alarm.id ? { ...a, isEnabled: false } : a))
              );
            }
            break;
          }
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [alarms]);

  const triggerAlarm = (alarm: Alarm) => {
    soundEngine.unlockAudio();
    setIsAudioUnlocked(true);
    setRingingAlarm(alarm);

    // Trigger Notification
    notificationService.showAlarmNotification(
      `${alarm.label || 'Alarm'}: ${alarm.time}`,
      lang === 'hi' ? 'अलार्म बज रहा है! उठने का समय हो गया।' : 'Alarm is ringing! Tap to dismiss.'
    );
  };

  const handleDismissActiveAlarm = () => {
    setRingingAlarm(null);
    soundEngine.stopTone();
    vibrationService.stopAlarmVibration();
  };

  const handleSnoozeActiveAlarm = (snoozeMinutes: number) => {
    if (!ringingAlarm) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + snoozeMinutes);
    const snoozeTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Create a temporary snooze alarm
    const snoozedAlarm: Alarm = {
      ...ringingAlarm,
      id: `snooze-${Date.now()}`,
      time: snoozeTimeStr,
      label: `${ringingAlarm.label || 'Alarm'} (Snoozed +${snoozeMinutes}m)`,
      days: [], // Ring once
      isEnabled: true,
      createdAt: Date.now(),
    };

    setAlarms((prev) => [snoozedAlarm, ...prev]);
    handleDismissActiveAlarm();
  };

  // Alarm management callbacks
  const handleToggleAlarm = (id: string) => {
    vibrationService.vibrateBrief(30);
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isEnabled: !a.isEnabled } : a))
    );
  };

  const handleSaveAlarm = (savedAlarm: Alarm) => {
    setAlarms((prev) => {
      const exists = prev.some((a) => a.id === savedAlarm.id);
      if (exists) {
        return prev.map((a) => (a.id === savedAlarm.id ? savedAlarm : a));
      } else {
        return [savedAlarm, ...prev];
      }
    });
    setIsAlarmModalOpen(false);
    setSelectedAlarmForEdit(null);
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    setIsAlarmModalOpen(false);
    setSelectedAlarmForEdit(null);
  };

  const handleOpenEdit = (alarm: Alarm) => {
    setSelectedAlarmForEdit(alarm);
    setIsAlarmModalOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedAlarmForEdit(null);
    setIsAlarmModalOpen(true);
  };

  const handleTestAlarmImmediate = (alarmToTest?: Alarm) => {
    const target = alarmToTest || alarms[0] || {
      id: 'test-alarm',
      time: '00:00',
      label: lang === 'hi' ? 'टेस्ट अलार्म रिंग' : 'Test Alarm Ring',
      isEnabled: true,
      days: [],
      sound: 'digital-beep',
      volume: 0.9,
      vibrate: true,
      snoozeDurationMinutes: 5,
      gentleWake: false,
      mission: 'math-easy',
      createdAt: Date.now(),
    };
    triggerAlarm(target);
  };

  return (
    <div
      onClick={handleUnlockAudio}
      className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200"
    >
      {/* Top Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        isWakeLockActive={isWakeLockActive}
        onToggleWakeLock={handleToggleWakeLock}
        isAudioUnlocked={isAudioUnlocked}
        onUnlockAudio={handleUnlockAudio}
        onOpenBedside={() => setIsBedsideOpen(true)}
        onOpenTips={() => setIsTipsOpen(true)}
        onTriggerTestAlarm={() => handleTestAlarmImmediate()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-6 pb-28">
        {activeTab === 'alarms' && (
          <div className="space-y-6">
            <DigitalClockHeader
              alarms={alarms}
              lang={lang}
              isAudioUnlocked={isAudioUnlocked}
              onUnlockAudio={handleUnlockAudio}
              onOpenNewAlarm={handleOpenNew}
            />
            <AlarmList
              alarms={alarms}
              lang={lang}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={handleOpenEdit}
              onDeleteAlarm={handleDeleteAlarm}
              onTestAlarmNow={handleTestAlarmImmediate}
              onOpenNewAlarm={handleOpenNew}
            />
          </div>
        )}

        {activeTab === 'clock' && (
          <div className="space-y-6">
            <DigitalClockHeader
              alarms={alarms}
              lang={lang}
              isAudioUnlocked={isAudioUnlocked}
              onUnlockAudio={handleUnlockAudio}
              onOpenNewAlarm={handleOpenNew}
            />
            {/* Bedside Mode Quick Card */}
            <div className="p-6 rounded-3xl bg-[#0f1422] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {t.nightstandMode}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'hi'
                      ? 'रात को मोबाइल टेबल पर रखने के लिए बड़ी घड़ी और स्क्रीन वेक-लॉक'
                      : 'Giant dimmable OLED night clock with screen wake-lock for your nightstand'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBedsideOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {lang === 'hi' ? 'नाइट मोड खोलें' : 'Launch Nightstand'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'timer' && <TimerView lang={lang} />}

        {activeTab === 'stopwatch' && <StopwatchView lang={lang} />}
      </main>

      {/* Floating Add Alarm Button (Mobile-first FAB) */}
      {activeTab === 'alarms' && (
        <button
          onClick={handleOpenNew}
          className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label={t.addNewAlarm}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#07090e]/90 backdrop-blur-xl border-t border-white/5 py-2 px-4">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('alarms')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'alarms'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className={`w-5 h-5 mb-1 ${activeTab === 'alarms' ? 'fill-amber-400/20 stroke-amber-400' : ''}`} />
            <span className="text-[11px] leading-tight">{t.tabAlarms}</span>
          </button>

          <button
            onClick={() => setActiveTab('clock')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'clock'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className={`w-5 h-5 mb-1 ${activeTab === 'clock' ? 'fill-amber-400/20 stroke-amber-400' : ''}`} />
            <span className="text-[11px] leading-tight">{t.tabClock}</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'timer'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hourglass className={`w-5 h-5 mb-1 ${activeTab === 'timer' ? 'fill-amber-400/20 stroke-amber-400' : ''}`} />
            <span className="text-[11px] leading-tight">{t.tabTimer}</span>
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'stopwatch'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className={`w-5 h-5 mb-1 ${activeTab === 'stopwatch' ? 'fill-amber-400/20 stroke-amber-400' : ''}`} />
            <span className="text-[11px] leading-tight">{t.tabStopwatch}</span>
          </button>
        </div>
      </nav>

      {/* Add / Edit Alarm Modal */}
      {isAlarmModalOpen && (
        <AlarmModal
          alarm={selectedAlarmForEdit}
          lang={lang}
          onSave={handleSaveAlarm}
          onClose={() => {
            setIsAlarmModalOpen(false);
            setSelectedAlarmForEdit(null);
          }}
          onDelete={handleDeleteAlarm}
        />
      )}

      {/* Fullscreen Active Ringing Alarm Overlay */}
      {ringingAlarm && (
        <ActiveAlarmScreen
          alarm={ringingAlarm}
          lang={lang}
          onDismiss={handleDismissActiveAlarm}
          onSnooze={handleSnoozeActiveAlarm}
        />
      )}

      {/* Bedside Nightstand Mode */}
      {isBedsideOpen && (
        <BedsideClockView
          alarms={alarms}
          lang={lang}
          onClose={() => setIsBedsideOpen(false)}
        />
      )}

      {/* Mobile Tips Modal */}
      {isTipsOpen && (
        <MobileTipsModal
          lang={lang}
          onClose={() => setIsTipsOpen(false)}
        />
      )}
    </div>
  );
}
