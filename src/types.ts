export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 1=Mon, ..., 6=Sat

export type SoundType = 
  | 'digital-beep'
  | 'gentle-chime'
  | 'radar-pulse'
  | 'retro-bell'
  | 'zen-bowl'
  | 'urgent-siren';

export interface SoundOption {
  id: SoundType;
  name: string;
  nameHindi: string;
  description: string;
  category: 'Energetic' | 'Calm' | 'Classic' | 'Loud';
}

export type MissionType = 'none' | 'math-easy' | 'math-medium' | 'math-hard' | 'tap-challenge';

export interface Alarm {
  id: string;
  time: string; // "HH:MM" in 24-hour format e.g. "07:30"
  label: string;
  isEnabled: boolean;
  days: DayOfWeek[]; // Empty array means "Once" (today or tomorrow)
  sound: SoundType;
  volume: number; // 0 to 1
  vibrate: boolean;
  snoozeDurationMinutes: number; // 5, 10, 15
  gentleWake: boolean; // Gradual volume ramp up
  mission: MissionType;
  createdAt: number;
}

export interface MathChallenge {
  question: string;
  answer: number;
  options: number[];
}

export type ActiveTab = 'alarms' | 'clock' | 'timer' | 'stopwatch';

export type Language = 'hi' | 'en';
