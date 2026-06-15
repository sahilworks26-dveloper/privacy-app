import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../utils/constants';
import {InstalledAppsNative, isNativeModuleAvailable} from './NativeBridge';
import type {ScanResult} from '../types/app';

export async function getWhitelist(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.WHITELIST);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function syncWhitelistToNative(): Promise<void> {
  const whitelist = await getWhitelist();
  if (isNativeModuleAvailable() && InstalledAppsNative) {
    await InstalledAppsNative.syncWhitelist(JSON.stringify(whitelist));
  }
}

export async function scanInstalledApps(): Promise<ScanResult> {
  if (!isNativeModuleAvailable() || !InstalledAppsNative) {
    throw new Error('App scanning is only available on Android');
  }

  await syncWhitelistToNative();
  const apps = await InstalledAppsNative.getInstalledApps();

  const systemApps = apps.filter(app => app.isSystemApp);
  const userApps = apps.filter(app => !app.isSystemApp);
  const authorized = userApps.filter(app => app.isAuthorized);
  const unauthorized = userApps.filter(app => !app.isAuthorized);
  const lastScan = new Date().toISOString();

  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCAN, lastScan);
  await AsyncStorage.setItem(
    STORAGE_KEYS.KNOWN_PACKAGES,
    JSON.stringify(userApps.map(app => app.packageName)),
  );

  return {
    apps,
    authorized,
    unauthorized,
    systemApps,
    totalScanned: userApps.length,
    compliantCount: authorized.length,
    lastScan,
  };
}

export async function getLastScanTime(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.LAST_SCAN);
}

export async function openAppSettings(packageName: string): Promise<void> {
  if (InstalledAppsNative?.openAppSettings) {
    await InstalledAppsNative.openAppSettings(packageName);
  }
}

export async function consumePendingNavigation(): Promise<string | null> {
  if (!InstalledAppsNative?.consumePendingNavigation) {
    return null;
  }
  return InstalledAppsNative.consumePendingNavigation();
}

export function getInstallerLabel(installerPackage: string): string {
  if (!installerPackage) {
    return 'Unknown / Sideloaded';
  }
  if (installerPackage === 'com.android.vending') {
    return 'Google Play Store';
  }
  if (installerPackage === 'com.google.android.packageinstaller') {
    return 'System Package Installer';
  }
  return installerPackage;
}

export function getComplianceColor(
  compliantCount: number,
  totalScanned: number,
): string {
  if (totalScanned === 0) {
    return '#94A3B8';
  }
  const ratio = compliantCount / totalScanned;
  if (ratio === 1) {
    return '#22C55E';
  }
  if (ratio >= 0.7) {
    return '#F59E0B';
  }
  return '#EF4444';
}
