import React, { useState } from 'react';
import { X, Volume2, Square, Play, Smartphone, BrainCircuit, Bell, Sparkles, Check } from 'lucide-react';
import { Alarm, DayOfWeek, Language, MissionType, SoundType } from '../types';
import { translations } from '../translations';
import { SOUND_OPTIONS, soundEngine } from '../services/soundEngine';
import { vibrationService } from '../services/vibrationService';

interface AlarmModalProps {
  alarm: Alarm | null; // null means create new
  lang: Language;
  onSave: (alarm: Alarm) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  alarm,
  lang,
  onSave,
  onClose,
  onDelete,
}) => {
  const t = translations[lang];

  // Parse initial hours and minutes from alarm or default to 07:00
  const initialTime = alarm ? alarm.time : '07:00';
  const [initHStr, initMStr] = initialTime.split(':');
  let initH = parseInt(initHStr, 10);
  const initPeriod: 'AM' | 'PM' = initH >= 12 ? 'PM' : 'AM';
  const init12H = initH % 12 || 12;

  const [hour12, setHour12] = useState<number>(init12H);
  const [minute, setMinute] = useState<number>(parseInt(initMStr, 10));
  const [period, setPeriod] = useState<'AM' | 'PM'>(initPeriod);

  const [label, setLabel] = useState<string>(alarm ? alarm.label : '');
  const [days, setDays] = useState<DayOfWeek[]>(alarm ? alarm.days : [1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<SoundType>(alarm ? alarm.sound : 'digital-beep');
  const [volume, setVolume] = useState<number>(alarm ? alarm.volume : 0.85);
  const [vibrate, setVibrate] = useState<boolean>(alarm ? alarm.vibrate : true);
  const [snoozeMin, setSnoozeMin] = useState<number>(alarm ? alarm.snoozeDurationMinutes : 10);
  const [gentleWake, setGentleWake] = useState<boolean>(alarm ? alarm.gentleWake : false);
  const [mission, setMission] = useState<MissionType>(alarm ? alarm.mission : 'none');

  // Preview sound state
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  const toggleSoundPreview = () => {
    soundEngine.unlockAudio();
    if (isPlayingPreview) {
      soundEngine.stopTone();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      soundEngine.playTone(sound, volume, false);
    }
  };

  const handleTestVibrate = () => {
    vibrationService.vibrateBrief(300);
  };

  const toggleDay = (day: DayOfWeek) => {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const setDaysPreset = (preset: 'once' | 'everyday' | 'weekdays' | 'weekends') => {
    if (preset === 'once') setDays([]);
    if (preset === 'everyday') setDays([0, 1, 2, 3, 4, 5, 6]);
    if (preset === 'weekdays') setDays([1, 2, 3, 4, 5]);
    if (preset === 'weekends') setDays([0, 6]);
  };

  const handleSave = () => {
    soundEngine.stopTone();
    // Convert 12h + period back to 24h string
    let h24 = hour12;
    if (period === 'PM' && h24 < 12) h24 += 12;
    if (period === 'AM' && h24 === 12) h24 = 0;
    const timeStr = `${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const newOrUpdatedAlarm: Alarm = {
      id: alarm ? alarm.id : `alarm-${Date.now()}`,
      time: timeStr,
      label: label.trim(),
      isEnabled: true, // auto enable on save
      days,
      sound,
      volume,
      vibrate,
      snoozeDurationMinutes: snoozeMin,
      gentleWake,
      mission,
      createdAt: alarm ? alarm.createdAt : Date.now(),
    };

    onSave(newOrUpdatedAlarm);
  };

  const handleQuickAddMinutes = (addedMin: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + addedMin);
    let h = now.getHours();
    const m = now.getMinutes();
    setPeriod(h >= 12 ? 'PM' : 'AM');
    h = h % 12 || 12;
    setHour12(h);
    setMinute(m);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0c101a] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0f1422]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-white">
              {alarm ? t.editAlarm : t.addNewAlarm}
            </h3>
          </div>
          <button
            onClick={() => {
              soundEngine.stopTone();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Time Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t.alarmTime}
            </label>
            <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-3">
              {/* Hour selector */}
              <select
                value={hour12}
                onChange={(e) => setHour12(parseInt(e.target.value, 10))}
                className="bg-[#1b233a] text-white text-3xl sm:text-4xl font-mono font-bold px-3 py-2 rounded-xl border border-white/10 focus:border-amber-400 outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>

              <span className="text-3xl font-mono text-amber-400 font-bold">:</span>

              {/* Minute selector */}
              <select
                value={minute}
                onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                className="bg-[#1b233a] text-white text-3xl sm:text-4xl font-mono font-bold px-3 py-2 rounded-xl border border-white/10 focus:border-amber-400 outline-none cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>

              {/* AM / PM Toggle */}
              <div className="flex flex-col gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    period === 'AM'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('PM')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    period === 'PM'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Quick time helpers */}
            <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 text-[11px] shrink-0">
                {lang === 'hi' ? 'जल्दी सेट करें:' : 'Quick set:'}
              </span>
              <button
                type="button"
                onClick={() => handleQuickAddMinutes(5)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 shrink-0"
              >
                +5m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddMinutes(15)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 shrink-0"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddMinutes(30)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 shrink-0"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => {
                  setHour12(6);
                  setMinute(0);
                  setPeriod('AM');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 shrink-0"
              >
                06:00 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  setHour12(7);
                  setMinute(0);
                  setPeriod('AM');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 shrink-0"
              >
                07:00 AM
              </button>
            </div>
          </div>

          {/* Label & Quick Suggestions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'hi' ? 'अलार्म का नाम / नोट' : 'Alarm Label'}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t.labelPlaceholder}
              className="w-full bg-[#131929] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {t.quickLabels.map((ql) => (
                <button
                  key={ql}
                  type="button"
                  onClick={() => setLabel(ql)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 cursor-pointer"
                >
                  {ql}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.repeat}
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDaysPreset('once')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400"
                >
                  {t.repeatOnce}
                </button>
                <button
                  type="button"
                  onClick={() => setDaysPreset('everyday')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-amber-400"
                >
                  {t.repeatEveryday}
                </button>
                <button
                  type="button"
                  onClick={() => setDaysPreset('weekdays')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-400"
                >
                  {t.repeatWeekdays}
                </button>
              </div>
            </div>

            {/* Circular Day Buttons */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
                const isSelected = days.includes(dayNum as DayOfWeek);
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => toggleDay(dayNum as DayOfWeek)}
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'bg-[#131929] border border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <span>{t.daysShort[dayNum]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Selection & Preview */}
          <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.soundAndVolume}
                </span>
              </div>
              {/* Play / Stop preview */}
              <button
                type="button"
                onClick={toggleSoundPreview}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isPlayingPreview
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
                }`}
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="w-3 h-3 fill-rose-300" />
                    <span>{t.stopPreview}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-cyan-300" />
                    <span>{t.previewSound}</span>
                  </>
                )}
              </button>
            </div>

            {/* Sound options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSound(opt.id);
                    if (isPlayingPreview) {
                      soundEngine.playTone(opt.id, volume, false);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    sound === opt.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-sm shadow-cyan-500/10'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center justify-between">
                    <span>{lang === 'hi' ? opt.nameHindi : opt.name}</span>
                    {sound === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </p>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Volume slider */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{lang === 'hi' ? 'वॉल्यूम (तीव्रता)' : 'Alarm Volume'}</span>
                <span className="font-mono text-cyan-400">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (isPlayingPreview) {
                    soundEngine.playTone(sound, val, false);
                  }
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Gentle Wake toggle */}
            <label className="flex items-center justify-between pt-1 cursor-pointer">
              <span className="text-xs text-slate-300">
                {t.gentleWake}
              </span>
              <input
                type="checkbox"
                checked={gentleWake}
                onChange={(e) => setGentleWake(e.target.checked)}
                className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Vibration */}
          <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-slate-200">{t.vibration}</p>
                <p className="text-[11px] text-slate-400">
                  {vibrationService.isSupported()
                    ? (lang === 'hi' ? 'अलार्म बजने पर फोन वाइब्रेट करेगा' : 'Pulses phone vibration motor while ringing')
                    : t.vibrationNotSupported}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {vibrationService.isSupported() && (
                <button
                  type="button"
                  onClick={handleTestVibrate}
                  className="px-2 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10"
                >
                  {t.testVibration}
                </button>
              )}
              <input
                type="checkbox"
                checked={vibrate}
                onChange={(e) => setVibrate(e.target.checked)}
                className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Wake-up Mission (Math puzzle to dismiss) */}
          <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.wakeUpMission}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'hi'
                ? 'यदि आप अलार्म बंद करके दोबारा सो जाते हैं, तो गणित का सवाल हल करके ही अलार्म बंद होगा!'
                : 'Stops you from turning off the alarm half-asleep. Solves heavy sleeping!'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                { id: 'none', label: t.missionNone },
                { id: 'math-easy', label: t.missionMathEasy },
                { id: 'math-medium', label: t.missionMathMedium },
                { id: 'tap-challenge', label: t.missionTap },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMission(m.id as MissionType)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                    mission === m.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Snooze Duration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t.snoozeDuration}
            </label>
            <div className="flex gap-2">
              {[5, 10, 15].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSnoozeMin(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    snoozeMin === m
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-[#131929] border border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {m} {lang === 'hi' ? 'मिनट' : 'mins'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0f1422] flex items-center justify-between gap-3 shrink-0">
          {alarm && onDelete ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.stopTone();
                onDelete(alarm.id);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 transition-all cursor-pointer"
            >
              {t.delete}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.stopTone();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {t.saveAlarm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
