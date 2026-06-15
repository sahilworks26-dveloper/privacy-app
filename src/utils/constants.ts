export const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#F59E0B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  accent: '#3B82F6',
} as const;

export const ALLOWED_INSTALLERS = [
  'com.android.vending',
  'com.google.android.packageinstaller',
] as const;

export const INSTALLER_LABELS: Record<string, string> = {
  'com.android.vending': 'Google Play Store',
  'com.google.android.packageinstaller': 'System Package Installer',
  '': 'Unknown / Sideloaded',
};

export const STORAGE_KEYS = {
  LAST_SCAN: '@appguard/lastScan',
  BACKGROUND_MONITORING: '@appguard/backgroundMonitoring',
  NOTIFY_UNAUTHORIZED: '@appguard/notifyUnauthorized',
  WHITELIST: '@appguard/whitelist',
  ADMIN_PIN_HASH: '@appguard/adminPinHash',
  POLICY_URL: '@appguard/policyUrl',
  REMOTE_POLICY: '@appguard/remotePolicy',
  ENROLLMENT_STATUS: '@appguard/enrollmentStatus',
  ENROLLMENT_SERVER: '@appguard/enrollmentServer',
  LAST_BACKGROUND_SCAN: '@appguard/lastBackgroundScan',
  KNOWN_PACKAGES: '@appguard/knownPackages',
} as const;

export const DEFAULT_POLICY_URL = '';
export const DEFAULT_ENROLLMENT_SERVER = '';

export const BACKGROUND_FETCH_INTERVAL_MINUTES = 15;
