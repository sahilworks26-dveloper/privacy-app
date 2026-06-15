import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../utils/constants';
import type {EnrollmentStatus} from '../types/app';
import {InstalledAppsNative, isNativeModuleAvailable} from './NativeBridge';
import {fetchRemotePolicy, getPolicyUrl} from './PolicyService';

export async function getEnrollmentServer(): Promise<string> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.ENROLLMENT_SERVER)) ?? '';
}

export async function setEnrollmentServer(url: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ENROLLMENT_SERVER, url.trim());
}

export async function getDeviceId(): Promise<string> {
  if (isNativeModuleAvailable() && InstalledAppsNative) {
    return InstalledAppsNative.getDeviceId();
  }
  const stored = await AsyncStorage.getItem('@appguard/fallbackDeviceId');
  if (stored) {
    return stored;
  }
  const fallback = `web-${Date.now()}`;
  await AsyncStorage.setItem('@appguard/fallbackDeviceId', fallback);
  return fallback;
}

export async function getEnrollmentStatus(): Promise<EnrollmentStatus> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLMENT_STATUS);
  const deviceId = await getDeviceId();
  if (!raw) {
    return {enrolled: false, deviceId};
  }
  try {
    return JSON.parse(raw) as EnrollmentStatus;
  } catch {
    return {enrolled: false, deviceId};
  }
}

export async function enrollDevice(
  enrollmentCode: string,
  organizationName?: string,
): Promise<EnrollmentStatus> {
  const serverUrl = await getEnrollmentServer();
  const deviceId = await getDeviceId();

  if (!serverUrl) {
    const localStatus: EnrollmentStatus = {
      enrolled: true,
      deviceId,
      organizationName: organizationName ?? 'Local Enrollment',
      enrolledAt: new Date().toISOString(),
      enrollmentCode,
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.ENROLLMENT_STATUS,
      JSON.stringify(localStatus),
    );
    return localStatus;
  }

  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/enroll`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      deviceId,
      enrollmentCode,
      organizationName,
      platform: 'android',
      app: 'AppGuard',
    }),
  });

  if (!response.ok) {
    throw new Error(`Enrollment failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    organizationName?: string;
    policyUrl?: string;
  };

  const status: EnrollmentStatus = {
    enrolled: true,
    deviceId,
    organizationName: data.organizationName ?? organizationName,
    enrolledAt: new Date().toISOString(),
    enrollmentCode,
  };

  await AsyncStorage.setItem(
    STORAGE_KEYS.ENROLLMENT_STATUS,
    JSON.stringify(status),
  );

  if (data.policyUrl) {
    await AsyncStorage.setItem(STORAGE_KEYS.POLICY_URL, data.policyUrl);
    await fetchRemotePolicy(data.policyUrl);
  } else {
    const policyUrl = await getPolicyUrl();
    if (policyUrl) {
      await fetchRemotePolicy(policyUrl);
    }
  }

  return status;
}

export async function unenrollDevice(): Promise<void> {
  const deviceId = await getDeviceId();
  await AsyncStorage.setItem(
    STORAGE_KEYS.ENROLLMENT_STATUS,
    JSON.stringify({enrolled: false, deviceId}),
  );
}
