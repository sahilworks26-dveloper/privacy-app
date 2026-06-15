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
} as const;
