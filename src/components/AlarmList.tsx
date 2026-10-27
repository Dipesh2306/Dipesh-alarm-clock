import React from 'react';
import { Bell, Volume2, BrainCircuit, Play, Trash2, Edit3, SmartphoneCharging } from 'lucide-react';
import { Alarm, Language } from '../types';
import { translations } from '../translations';
import { formatTimeRemaining, formatTo12Hour, getNextAlarmOccurrence } from '../utils/timeUtils';
import { SOUND_OPTIONS } from '../services/soundEngine';

interface AlarmListProps {
  alarms: Alarm[];
  lang: Language;
  onToggleAlarm: (id: string) => void;
  onEditAlarm: (alarm: Alarm) => void;
  onDeleteAlarm: (id: string) => void;
  onTestAlarmNow: (alarm: Alarm) => void;
  onOpenNewAlarm: () => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  lang,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  onTestAlarmNow,
  onOpenNewAlarm,
}) => {
  const t = translations[lang];
  const now = new Date();

  // Helper to format days
  const formatDaysSummary = (alarm: Alarm) => {
    if (!alarm.days || alarm.days.length === 0) {
      return t.repeatOnce;
    }
    if (alarm.days.length === 7) {
      return t.repeatEveryday;
    }
    const isWeekdays = alarm.days.length === 5 && [1, 2, 3, 4, 5].every(d => alarm.days.includes(d as any));
    if (isWeekdays) {
      return t.repeatWeekdays;
    }
    const isWeekends = alarm.days.length === 2 && [0, 6].every(d => alarm.days.includes(d as any));
    if (isWeekends) {
      return t.repeatWeekends;
    }
    return alarm.days
      .sort((a, b) => a - b)
      .map(d => t.daysShort[d])
      .join(', ');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
          {lang === 'hi' ? 'आपके अलार्म' : 'Your Alarms'} ({alarms.length})
        </h2>
        <span className="text-xs text-amber-400/80 font-medium">
          {alarms.filter(a => a.isEnabled).length} {lang === 'hi' ? 'सक्रिय' : 'active'}
        </span>
      </div>

      {alarms.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-white/10 bg-[#0e1320]/60">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4">
            <Bell className="w-8 h-8 opacity-60" />
          </div>
          <p className="font-semibold text-slate-200 text-base">{t.noAlarmsYet}</p>
          <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
            {t.createFirstAlarm}
          </p>
          <button
            onClick={onOpenNewAlarm}
            className="mt-5 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            + {t.addNewAlarm}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {alarms.map((alarm) => {
            const { time, period } = formatTo12Hour(alarm.time);
            const soundMeta = SOUND_OPTIONS.find(s => s.id === alarm.sound);
            const nextOccurrence = alarm.isEnabled ? getNextAlarmOccurrence(alarm, now) : null;
            const remainingText = nextOccurrence ? formatTimeRemaining(nextOccurrence, now, lang) : null;

            return (
              <div
                key={alarm.id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                  alarm.isEnabled
                    ? 'bg-gradient-to-r from-[#121826] to-[#0d121f] border-amber-500/30 shadow-lg shadow-black/40'
                    : 'bg-[#0d111a]/60 border-white/5 opacity-70'
                }`}
              >
                <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  {/* Left Column: Time & Details */}
                  <div
                    onClick={() => onEditAlarm(alarm)}
                    className="flex-1 min-w-0 cursor-pointer group"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight transition-colors ${
                        alarm.isEnabled ? 'text-white group-hover:text-amber-300' : 'text-slate-400'
                      }`}>
                        {time}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        alarm.isEnabled
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/5 text-slate-500'
                      }`}>
                        {period}
                      </span>

                      {alarm.isEnabled && remainingText && (
                        <span className="hidden sm:inline-block text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 ml-2">
                          {t.nextAlarmIn} {remainingText}
                        </span>
                      )}
                    </div>

                    {/* Alarm Label */}
                    <p className="mt-1 text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                      {alarm.label || (lang === 'hi' ? 'अलार्म' : 'Alarm')}
                    </p>

                    {/* Meta tags: Repeat, Sound, Mission */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {/* Repeat badge */}
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-medium">
                        {formatDaysSummary(alarm)}
                      </span>

                      {/* Sound badge */}
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        <Volume2 className="w-3 h-3" />
                        <span>{lang === 'hi' ? soundMeta?.nameHindi : soundMeta?.name}</span>
                      </span>

                      {/* Wake-up Mission badge */}
                      {alarm.mission !== 'none' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                          <BrainCircuit className="w-3 h-3" />
                          <span>{alarm.mission === 'tap-challenge' ? '5 Taps' : 'Math'}</span>
                        </span>
                      )}

                      {/* Vibration badge */}
                      {alarm.vibrate && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px]" title="Vibration Enabled">
                          Vib
                        </span>
                      )}
                    </div>

                    {/* Mobile countdown line */}
                    {alarm.isEnabled && remainingText && (
                      <p className="sm:hidden mt-2 text-[11px] font-semibold text-emerald-400">
                        {t.nextAlarmIn} {remainingText}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Toggle switch & Actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alarm.isEnabled}
                        onChange={() => onToggleAlarm(alarm.id)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-amber-400"></div>
                    </label>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1 mt-1">
                      {/* Ring preview / test button */}
                      <button
                        onClick={() => onTestAlarmNow(alarm)}
                        title={lang === 'hi' ? 'अलार्म बजा कर देखें' : 'Test Ring Alarm'}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => onEditAlarm(alarm)}
                        title={t.editAlarm}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => onDeleteAlarm(alarm.id)}
                        title={t.delete}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
