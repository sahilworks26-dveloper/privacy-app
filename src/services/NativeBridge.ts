import {NativeModules, Platform} from 'react-native';
import type {InstalledApp} from '../types/app';

interface InstalledAppsNativeModule {
  getInstalledApps(): Promise<InstalledApp[]>;
  getAppInfo(packageName: string): Promise<InstalledApp>;
  openAppSettings(packageName: string): Promise<boolean>;
  syncMonitoringSettings(
    monitoringEnabled: boolean,
    notifyEnabled: boolean,
  ): Promise<boolean>;
  syncWhitelist(whitelistJson: string): Promise<boolean>;
  syncRemotePolicy(allowedInstallersJson: string): Promise<boolean>;
  getDeviceId(): Promise<string>;
  exportReportPdf(reportText: string): Promise<{
    filePath: string;
    contentUri: string;
  }>;
  shareFile(contentUri: string, mimeType: string): Promise<boolean>;
  consumePendingNavigation(): Promise<string | null>;
}

export const InstalledAppsNative = NativeModules.InstalledApps as
  | InstalledAppsNativeModule
  | undefined;

export function isNativeModuleAvailable(): boolean {
  return Platform.OS === 'android' && InstalledAppsNative != null;
}
