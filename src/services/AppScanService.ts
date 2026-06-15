import {NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALLOWED_INSTALLERS, STORAGE_KEYS} from '../utils/constants';
import type {InstalledApp, ScanResult} from '../types/app';

interface InstalledAppsNativeModule {
  getInstalledApps(): Promise<InstalledApp[]>;
  openAppSettings(packageName: string): Promise<boolean>;
}

const {InstalledApps} = NativeModules as {
  InstalledApps: InstalledAppsNativeModule;
};

function isAppAuthorized(
  app: InstalledApp,
  whitelist: string[],
): boolean {
  if (whitelist.includes(app.packageName)) {
    return true;
  }
  if (app.isSystemApp) {
    return true;
  }
  if (!app.installerPackage) {
    return false;
  }
  return ALLOWED_INSTALLERS.includes(
    app.installerPackage as (typeof ALLOWED_INSTALLERS)[number],
  );
}

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

export async function scanInstalledApps(): Promise<ScanResult> {
  if (Platform.OS !== 'android' || !InstalledApps) {
    throw new Error('App scanning is only available on Android');
  }

  const whitelist = await getWhitelist();
  const rawApps = await InstalledApps.getInstalledApps();

  const apps: InstalledApp[] = rawApps.map(app => ({
    ...app,
    isAuthorized: isAppAuthorized(app, whitelist),
  }));

  const systemApps = apps.filter(app => app.isSystemApp);
  const userApps = apps.filter(app => !app.isSystemApp);
  const authorized = userApps.filter(app => app.isAuthorized);
  const unauthorized = userApps.filter(app => !app.isAuthorized);
  const lastScan = new Date().toISOString();

  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCAN, lastScan);

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
  if (Platform.OS === 'android' && InstalledApps?.openAppSettings) {
    await InstalledApps.openAppSettings(packageName);
  }
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
