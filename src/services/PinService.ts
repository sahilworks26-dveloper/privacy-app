import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../utils/constants';

function hashPin(pin: string): string {
  const salted = `appguard_v1_${pin}`;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}`;
}

export async function isPinSet(): Promise<boolean> {
  const hash = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PIN_HASH);
  return hash != null && hash.length > 0;
}

export async function setAdminPin(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4–6 digits');
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PIN_HASH, hashPin(pin));
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PIN_HASH);
  if (!stored) {
    return true;
  }
  return stored === hashPin(pin);
}

export async function clearAdminPin(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_PIN_HASH);
}

export async function changeAdminPin(
  currentPin: string,
  newPin: string,
): Promise<void> {
  const valid = await verifyAdminPin(currentPin);
  if (!valid) {
    throw new Error('Current PIN is incorrect');
  }
  await setAdminPin(newPin);
}
