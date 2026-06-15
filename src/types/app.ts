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

export interface RemotePolicy {
  version: number;
  allowedInstallers: string[];
  blockSideloading: boolean;
  updatedAt: string;
}

export interface EnrollmentStatus {
  enrolled: boolean;
  deviceId: string;
  organizationName?: string;
  enrolledAt?: string;
  enrollmentCode?: string;
}

export interface ComplianceReport {
  generatedAt: string;
  deviceId: string;
  enrollment?: EnrollmentStatus;
  policy?: RemotePolicy;
  summary: {
    totalUserApps: number;
    compliant: number;
    unauthorized: number;
  };
  apps: Array<{
    appName: string;
    packageName: string;
    installer: string;
    isSystemApp: boolean;
    isAuthorized: boolean;
  }>;
}
