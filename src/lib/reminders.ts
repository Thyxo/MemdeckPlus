/**
 * Daglige påmindelser via Notification API.
 * Uden backend/push kan browseren kun vise beskeden, når appen (eller dens service worker) kører.
 * Vi tjekker derfor ved opstart, når appen kommer i forgrunden og hvert minut, mens den er åben.
 */
import { t } from '../i18n';
import { getState, update } from '../store/store';
import { ymd } from './date';

export const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export async function showNotification(title: string, body: string) {
  if (!notificationsSupported || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'daily' });
    else new Notification(title, { body, icon: '/icons/icon-192.png' });
  } catch { /* ignoreres */ }
}

export function maybeRemind() {
  const s = getState();
  const r = s.settings.reminders;
  if (!r.enabled || !notificationsSupported || Notification.permission !== 'granted') return;
  const today = ymd();
  if (s.lastReminder === today) return;
  const now = new Date();
  const [h, m] = r.time.split(':').map(Number);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  const done = s.days[today]?.answers ?? 0;
  update((d) => { d.lastReminder = today; });
  if (done >= s.settings.dailyGoal) return;
  showNotification('Memdeck Plus', t('reminderBody', { n: s.settings.dailyGoal - done }));
}
