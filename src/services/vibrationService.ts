class VibrationService {
  private vibrateInterval: number | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }

  public vibrateBrief(durationMs: number = 60) {
    if (this.isSupported()) {
      try {
        navigator.vibrate(durationMs);
      } catch {}
    }
  }

  public startAlarmVibration() {
    this.stopAlarmVibration();
    if (!this.isSupported()) return;

    // Pattern: vibrate 500ms, pause 250ms, vibrate 500ms, pause 250ms, vibrate 1000ms, pause 500ms
    const pattern = [500, 250, 500, 250, 800, 500];
    try {
      navigator.vibrate(pattern);
      const totalTime = pattern.reduce((acc, val) => acc + val, 0);
      this.vibrateInterval = window.setInterval(() => {
        try {
          navigator.vibrate(pattern);
        } catch {}
      }, totalTime + 100);
    } catch {}
  }

  public stopAlarmVibration() {
    if (this.vibrateInterval !== null) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
    if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }
}

export const vibrationService = new VibrationService();
