import {applyFirebasePolicyPayload} from './PolicyService';

let initialized = false;

/**
 * Firebase Cloud Messaging policy push.
 * To enable:
 * 1. Add google-services.json to android/app/
 * 2. npm install @react-native-firebase/app @react-native-firebase/messaging
 * 3. Configure Firebase in android/build.gradle per RN Firebase docs
 * 4. Call initFirebasePolicyPush() from App.tsx
 */
export function isFirebaseAvailable(): boolean {
  return false;
}

export async function initFirebasePolicyPush(): Promise<boolean> {
  if (initialized) {
    return false;
  }
  initialized = true;
  return false;
}

/** Apply policy payload received from FCM data message (call from FCM handler). */
export async function handlePolicyPushPayload(
  payload: Record<string, unknown>,
): Promise<void> {
  if (payload.type === 'policy_update') {
    await applyFirebasePolicyPayload(payload);
  }
}
