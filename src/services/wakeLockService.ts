type WakeLockSentinelType = {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  released: boolean;
};

class WakeLockService {
  private wakeLock: WakeLockSentinelType | null = null;
  private isRequestedByUser: boolean = false;
  private listeners: Set<(isActive: boolean) => void> = new Set();

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequestedByUser) {
          this.acquire();
        }
      });
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  public isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released;
  }

  public subscribe(cb: (isActive: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isActive());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const active = this.isActive();
    this.listeners.forEach((cb) => cb(active));
  }

  public async acquire(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinelType> } };
      this.wakeLock = await nav.wakeLock.request('screen');
      this.isRequestedByUser = true;
      this.wakeLock.addEventListener('release', () => {
        this.notify();
      });
      this.notify();
      return true;
    } catch {
      this.wakeLock = null;
      this.notify();
      return false;
    }
  }

  public async release(): Promise<void> {
    this.isRequestedByUser = false;
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
    this.notify();
  }

  public async toggle(): Promise<boolean> {
    if (this.isActive()) {
      await this.release();
      return false;
    } else {
      return await this.acquire();
    }
  }
}

export const wakeLockService = new WakeLockService();
