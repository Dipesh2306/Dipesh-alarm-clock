class NotificationService {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  public showAlarmNotification(title: string, body: string) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      const options: NotificationOptions = {
        body,
        icon: '/favicon.ico',
        tag: 'alarm-ringing',
        requireInteraction: true,
        silent: false,
      };

      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn("Notification error:", e);
    }
  }
}

export const notificationService = new NotificationService();
