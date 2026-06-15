import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import type {InstalledApp} from '../types/app';

const CHANNEL_ID = 'appguard-alerts';

export async function initNotifications(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'AppGuard Security Alerts',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
}

export async function requestNotificationPermission(): Promise<void> {
  await notifee.requestPermission();
}

export async function notifyUnauthorizedApp(
  app: InstalledApp,
): Promise<void> {
  await initNotifications();

  await notifee.displayNotification({
    title: '⚠️ Unauthorized App Installed',
    body: `${app.appName} was installed from an unknown source`,
    android: {
      channelId: CHANNEL_ID,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      smallIcon: 'ic_launcher',
    },
    data: {
      screen: 'UnauthorizedApps',
      packageName: app.packageName,
    },
  });
}

export async function notifyUnauthorizedApps(
  apps: InstalledApp[],
): Promise<void> {
  if (apps.length === 0) {
    return;
  }

  if (apps.length === 1) {
    await notifyUnauthorizedApp(apps[0]);
    return;
  }

  await initNotifications();
  await notifee.displayNotification({
    title: '⚠️ Unauthorized Apps Detected',
    body: `${apps.length} apps were not installed from Google Play Store`,
    android: {
      channelId: CHANNEL_ID,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      smallIcon: 'ic_launcher',
    },
    data: {
      screen: 'UnauthorizedApps',
    },
  });
}

export function setupNotificationHandlers(
  onNavigateUnauthorized: () => void,
): () => void {
  const unsubscribe = notifee.onForegroundEvent(({type}) => {
    if (type === EventType.PRESS) {
      onNavigateUnauthorized();
    }
  });

  return unsubscribe;
}
