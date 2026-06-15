import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLastScanTime,
  scanInstalledApps,
} from '../services/AppScanService';
import {
  notifyUnauthorizedApps,
  requestNotificationPermission,
} from '../services/NotificationService';
import {STORAGE_KEYS} from '../utils/constants';
import type {ScanResult} from '../types/app';

interface UseInstalledAppsResult {
  scanResult: ScanResult | null;
  loading: boolean;
  error: string | null;
  scan: () => Promise<void>;
  lastScanDisplay: string;
}

export function useInstalledApps(autoScan = true): UseInstalledAppsResult {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanDisplay, setLastScanDisplay] = useState('Never');

  const updateLastScanDisplay = useCallback(async (iso?: string) => {
    const timestamp = iso ?? (await getLastScanTime());
    if (!timestamp) {
      setLastScanDisplay('Never');
      return;
    }
    setLastScanDisplay(new Date(timestamp).toLocaleString());
  }, []);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanInstalledApps();
      setScanResult(result);
      await updateLastScanDisplay(result.lastScan);

      const notifyEnabled = await AsyncStorage.getItem(
        STORAGE_KEYS.NOTIFY_UNAUTHORIZED,
      );
      if (notifyEnabled === 'true' && result.unauthorized.length > 0) {
        await requestNotificationPermission();
        await notifyUnauthorizedApps(result.unauthorized);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to scan installed apps';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [updateLastScanDisplay]);

  useEffect(() => {
    updateLastScanDisplay();
    if (autoScan) {
      scan();
    }
  }, [autoScan, scan, updateLastScanDisplay]);

  return {
    scanResult,
    loading,
    error,
    scan,
    lastScanDisplay,
  };
}
