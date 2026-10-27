import { Alarm } from '../types';

const STORAGE_KEY = 'smart_alarm_clock_alarms_v1';
const AUDIO_UNLOCKED_KEY = 'smart_alarm_audio_unlocked';
const LANGUAGE_KEY = 'smart_alarm_language';

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-1',
    time: '06:30',
    label: 'Morning Wakeup / सुबह उठो',
    isEnabled: true,
    days: [1, 2, 3, 4, 5], // Mon to Fri
    sound: 'digital-beep',
    volume: 0.9,
    vibrate: true,
    snoozeDurationMinutes: 10,
    gentleWake: true,
    mission: 'math-easy',
    createdAt: Date.now() - 100000,
  },
  {
    id: 'alarm-2',
    time: '08:00',
    label: 'Weekend Relax / नाश्ता',
    isEnabled: false,
    days: [0, 6], // Sun, Sat
    sound: 'gentle-chime',
    volume: 0.8,
    vibrate: true,
    snoozeDurationMinutes: 10,
    gentleWake: false,
    mission: 'none',
    createdAt: Date.now() - 50000,
  },
];

export function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAlarms(INITIAL_ALARMS);
      return INITIAL_ALARMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_ALARMS;
  } catch {
    return INITIAL_ALARMS;
  }
}

export function saveAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch (e) {
    console.error('Failed to save alarms to localStorage', e);
  }
}

export function loadLanguage(): 'en' | 'hi' {
  try {
    const lang = localStorage.getItem(LANGUAGE_KEY);
    if (lang === 'en' || lang === 'hi') return lang;
    return 'hi'; // Default to Hindi as user requested in Hindi
  } catch {
    return 'hi';
  }
}

export function saveLanguage(lang: 'en' | 'hi'): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}
