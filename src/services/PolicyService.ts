import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../utils/constants';
import type {RemotePolicy} from '../types/app';
import {InstalledAppsNative, isNativeModuleAvailable} from './NativeBridge';

const DEFAULT_POLICY: RemotePolicy = {
  version: 1,
  allowedInstallers: [
    'com.android.vending',
    'com.google.android.packageinstaller',
  ],
  blockSideloading: true,
  updatedAt: new Date().toISOString(),
};

export async function getPolicyUrl(): Promise<string> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.POLICY_URL)) ?? '';
}

export async function setPolicyUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.POLICY_URL, url.trim());
}

export async function getStoredPolicy(): Promise<RemotePolicy> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMOTE_POLICY);
  if (!raw) {
    return DEFAULT_POLICY;
  }
  try {
    return JSON.parse(raw) as RemotePolicy;
  } catch {
    return DEFAULT_POLICY;
  }
}

async function syncPolicyToNative(policy: RemotePolicy): Promise<void> {
  if (isNativeModuleAvailable() && InstalledAppsNative) {
    await InstalledAppsNative.syncRemotePolicy(
      JSON.stringify(policy.allowedInstallers),
    );
  }
}

export async function fetchRemotePolicy(
  urlOverride?: string,
): Promise<RemotePolicy> {
  const url = urlOverride ?? (await getPolicyUrl());
  if (!url) {
    return getStoredPolicy();
  }

  const response = await fetch(url, {
    headers: {Accept: 'application/json'},
  });

  if (!response.ok) {
    throw new Error(`Policy server returned ${response.status}`);
  }

  const data = (await response.json()) as Partial<RemotePolicy>;
  const policy: RemotePolicy = {
    version: data.version ?? 1,
    allowedInstallers:
      data.allowedInstallers ?? DEFAULT_POLICY.allowedInstallers,
    blockSideloading: data.blockSideloading ?? true,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.REMOTE_POLICY, JSON.stringify(policy));
  await syncPolicyToNative(policy);
  return policy;
}

export async function initPolicy(): Promise<void> {
  const policy = await getStoredPolicy();
  await syncPolicyToNative(policy);
}

export async function applyFirebasePolicyPayload(
  payload: Record<string, unknown>,
): Promise<RemotePolicy> {
  const policy: RemotePolicy = {
    version: typeof payload.version === 'number' ? payload.version : 1,
    allowedInstallers: Array.isArray(payload.allowedInstallers)
      ? (payload.allowedInstallers as string[])
      : DEFAULT_POLICY.allowedInstallers,
    blockSideloading: payload.blockSideloading !== false,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.REMOTE_POLICY, JSON.stringify(policy));
  await syncPolicyToNative(policy);
  return policy;
}
