export interface InstalledApp {
  packageName: string;
  appName: string;
  installerPackage: string;
  isSystemApp: boolean;
  isAuthorized: boolean;
  icon: string;
}

export interface ScanResult {
  apps: InstalledApp[];
  authorized: InstalledApp[];
  unauthorized: InstalledApp[];
  systemApps: InstalledApp[];
  totalScanned: number;
  compliantCount: number;
  lastScan: string;
}

export interface AppSettings {
  backgroundMonitoring: boolean;
  notifyUnauthorized: boolean;
  whitelist: string[];
}
