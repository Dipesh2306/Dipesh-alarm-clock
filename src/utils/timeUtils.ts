import { Alarm, DayOfWeek, MathChallenge, MissionType, Language } from '../types';

/**
 * Calculates next date when an alarm should ring
 */
export function getNextAlarmOccurrence(alarm: Alarm, fromDate: Date = new Date()): Date {
  const [alarmHours, alarmMinutes] = alarm.time.split(':').map(Number);
  
  // If no repeat days are selected, it's a one-time alarm
  if (!alarm.days || alarm.days.length === 0) {
    const candidate = new Date(fromDate);
    candidate.setHours(alarmHours, alarmMinutes, 0, 0);
    
    // If time has already passed today (with at least 2 seconds buffer), schedule for tomorrow
    if (candidate.getTime() <= fromDate.getTime() + 2000) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  // Repeating alarm on specific days of the week (0=Sun, 1=Mon, ..., 6=Sat)
  const currentDay = fromDate.getDay() as DayOfWeek;
  const currentHour = fromDate.getHours();
  const currentMinute = fromDate.getMinutes();

  let minDaysDiff = 100;

  for (const day of alarm.days) {
    let diff = (day - currentDay + 7) % 7;
    
    // If today is one of the alarm days
    if (diff === 0) {
      // Check if alarm time hasn't passed today yet
      const alarmIsLaterToday =
        alarmHours > currentHour ||
        (alarmHours === currentHour && alarmMinutes > currentMinute);
      
      if (!alarmIsLaterToday) {
        // Will ring next week on this day
        diff = 7;
      }
    }

    if (diff < minDaysDiff) {
      minDaysDiff = diff;
    }
  }

  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + minDaysDiff);
  nextDate.setHours(alarmHours, alarmMinutes, 0, 0);
  return nextDate;
}

/**
 * Finds the earliest next alarm from a list of enabled alarms
 */
export function getEarliestNextAlarm(alarms: Alarm[], fromDate: Date = new Date()): { alarm: Alarm; date: Date } | null {
  const enabledAlarms = alarms.filter(a => a.isEnabled);
  if (enabledAlarms.length === 0) return null;

  let earliest: { alarm: Alarm; date: Date } | null = null;

  for (const alarm of enabledAlarms) {
    const nextDate = getNextAlarmOccurrence(alarm, fromDate);
    if (!earliest || nextDate.getTime() < earliest.date.getTime()) {
      earliest = { alarm, date: nextDate };
    }
  }

  return earliest;
}

/**
 * Format time remaining e.g. "6 hours 15 mins" or Hindi equivalent
 */
export function formatTimeRemaining(targetDate: Date, fromDate: Date = new Date(), lang: Language = 'en'): string {
  const diffMs = targetDate.getTime() - fromDate.getTime();
  if (diffMs <= 0) {
    return lang === 'hi' ? 'अभी बजेगा' : 'about to ring';
  }

  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (lang === 'hi') {
    if (hours === 0 && minutes === 0) return '1 मिनट से कम में';
    if (hours === 0) return `${minutes} मिनट में`;
    if (minutes === 0) return `${hours} घंटे में`;
    return `${hours} घंटे ${minutes} मिनट में`;
  }

  if (hours === 0 && minutes === 0) return 'in less than a minute';
  if (hours === 0) return `in ${minutes}m`;
  if (minutes === 0) return `in ${hours}h`;
  return `in ${hours}h ${minutes}m`;
}

/**
 * Format 24h string ("14:30") to 12h display ("02:30 PM")
 */
export function formatTo12Hour(timeStr: string): { time: string; period: 'AM' | 'PM' } {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const timeFormatted = `${h < 10 ? '0' + h : h}:${mStr}`;
  return { time: timeFormatted, period };
}

/**
 * Generate Math Challenges for Heavy Sleeper Mission
 */
export function generateMathChallenge(mission: MissionType): MathChallenge {
  let a = 0;
  let b = 0;
  let op = '+';
  let answer = 0;

  if (mission === 'math-easy') {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * 30) + 10;
    op = Math.random() > 0.4 ? '+' : '-';
    if (op === '-' && a < b) [a, b] = [b, a];
    answer = op === '+' ? a + b : a - b;
  } else if (mission === 'math-medium') {
    a = Math.floor(Math.random() * 60) + 25;
    b = Math.floor(Math.random() * 45) + 15;
    op = Math.random() > 0.3 ? '+' : '-';
    if (op === '-' && a < b) [a, b] = [b, a];
    answer = op === '+' ? a + b : a - b;
  } else {
    // Hard math
    a = Math.floor(Math.random() * 12) + 6;
    b = Math.floor(Math.random() * 9) + 4;
    const c = Math.floor(Math.random() * 20) + 5;
    answer = a * b + c;
    return {
      question: `${a} × ${b} + ${c} = ?`,
      answer,
      options: shuffleArray([
        answer,
        answer + (Math.random() > 0.5 ? 2 : -2),
        answer + (Math.random() > 0.5 ? 10 : -10),
        answer + (Math.random() > 0.5 ? 5 : -5),
      ]),
    };
  }

  // Generate 4 plausible distinct choices
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 6) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) {
      options.add(candidate);
    }
  }

  return {
    question: `${a} ${op} ${b} = ?`,
    answer,
    options: shuffleArray(Array.from(options)),
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
