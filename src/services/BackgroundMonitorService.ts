import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundFetch from 'react-native-background-fetch';
import {BACKGROUND_FETCH_INTERVAL_MINUTES, STORAGE_KEYS} from '../utils/constants';
import {scanInstalledApps, syncWhitelistToNative} from './AppScanService';
import {InstalledAppsNative, isNativeModuleAvailable} from './NativeBridge';
import {
  notifyUnauthorizedApps,
  requestNotificationPermission,
} from './NotificationService';

export async function syncMonitoringToNative(): Promise<void> {
  if (!isNativeModuleAvailable() || !InstalledAppsNative) {
    return;
  }

  const [monitoring, notify] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_MONITORING),
    AsyncStorage.getItem(STORAGE_KEYS.NOTIFY_UNAUTHORIZED),
  ]);

  await InstalledAppsNative.syncMonitoringSettings(
    monitoring === 'true',
    notify !== 'false',
  );
}

export async function setBackgroundMonitoring(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.BACKGROUND_MONITORING,
    enabled.toString(),
  );
  await syncMonitoringToNative();

  if (enabled) {
    await configureBackgroundFetch();
  } else {
    await BackgroundFetch.stop();
  }
}

export async function configureBackgroundFetch(): Promise<void> {
  const monitoring = await AsyncStorage.getItem(
    STORAGE_KEYS.BACKGROUND_MONITORING,
  );
  if (monitoring !== 'true') {
    return;
  }

  await BackgroundFetch.configure(
    {
      minimumFetchInterval: BACKGROUND_FETCH_INTERVAL_MINUTES,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    },
    async taskId => {
      await runBackgroundComplianceCheck();
      BackgroundFetch.finish(taskId);
    },
    async taskId => {
      BackgroundFetch.finish(taskId);
    },
  );

  await BackgroundFetch.start();
}

export async function runBackgroundComplianceCheck(): Promise<void> {
  const monitoring = await AsyncStorage.getItem(
    STORAGE_KEYS.BACKGROUND_MONITORING,
  );
  if (monitoring !== 'true') {
    return;
  }

  await syncWhitelistToNative();
  const result = await scanInstalledApps();
  await AsyncStorage.setItem(
    STORAGE_KEYS.LAST_BACKGROUND_SCAN,
    new Date().toISOString(),
  );

  const notifyEnabled = await AsyncStorage.getItem(
    STORAGE_KEYS.NOTIFY_UNAUTHORIZED,
  );
  if (notifyEnabled !== 'false' && result.unauthorized.length > 0) {
    const knownRaw = await AsyncStorage.getItem(STORAGE_KEYS.KNOWN_PACKAGES);
    const known = knownRaw ? (JSON.parse(knownRaw) as string[]) : [];
    const newUnauthorized = result.unauthorized.filter(
      app => !known.includes(app.packageName),
    );

    if (newUnauthorized.length > 0) {
      await requestNotificationPermission();
      await notifyUnauthorizedApps(newUnauthorized);
    }
  }
}

export async function initBackgroundMonitoring(): Promise<void> {
  await syncMonitoringToNative();
  const monitoring = await AsyncStorage.getItem(
    STORAGE_KEYS.BACKGROUND_MONITORING,
  );
  if (monitoring === 'true') {
    await configureBackgroundFetch();
  }
}
