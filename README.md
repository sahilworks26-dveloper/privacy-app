# AppGuard

**AppGuard** is an MDM-lite Android app built with React Native that enforces a simple policy: only apps installed from the Google Play Store are considered compliant. Apps sideloaded via APK or unknown sources are detected and surfaced to the user.

## Features

### Phase 1 — Core MVP
- Native Android module scans all installed apps and reads installer source
- Dashboard with compliance score and manual scan
- Unauthorized apps list with "How to Remove" → opens Android app settings
- All apps browser with search and filter tabs
- Dark-themed UI
- Local notifications when unauthorized apps are found
- Settings: notification toggle, whitelist, JSON export

### Phase 2 — Advanced MDM
- **Real-time monitoring** — `BroadcastReceiver` for `ACTION_PACKAGE_ADDED` with native notifications
- **Foreground monitor service** — persistent notification when background monitoring is on
- **Periodic background scans** — `react-native-background-fetch` every 15 minutes (headless JS)
- **Admin PIN lock** — protect Settings and Enrollment screens
- **PDF / Text / JSON export** — native PDF generation via Android `PdfDocument`
- **Remote policy push** — fetch policy JSON from a URL; syncs allowed installers to native layer
- **MDM enrollment flow** — device ID, enrollment code, optional server POST to `/enroll`
- **Firebase FCM ready** — stub service; enable with `google-services.json` + `@react-native-firebase/messaging`

## Tech Stack

- React Native 0.76.9 (CLI, TypeScript)
- Java native modules (`InstalledAppsModule`, receivers, foreground service)
- React Navigation (Stack)
- AsyncStorage, Notifee, react-native-background-fetch
- react-native-vector-icons

## Project Structure

```
AppGuard/
├── android/app/src/main/java/com/appguard/
│   ├── InstalledAppsModule.java      # App scan, PDF export, prefs sync
│   ├── PackageInstallReceiver.java   # Real-time install detection
│   ├── InstallMonitorService.java    # Foreground monitoring service
│   ├── BootCompletedReceiver.java    # Restart monitor after reboot
│   ├── AppComplianceChecker.java     # Shared compliance logic
│   └── AppGuardPrefs.java            # Native SharedPreferences
├── src/
│   ├── screens/          # Home, Unauthorized, AllApps, Settings, PinLock, Enrollment
│   ├── services/         # Scan, Background, Policy, Enrollment, Report, Pin
│   └── hooks/
├── docs/sample-policy.json
└── App.tsx
```

## Prerequisites

- Node.js 18+
- JDK 17
- Android Studio with SDK 34+
- Physical Android device (recommended)

## Setup & Run

```bash
cd AppGuard
npm install
npm start          # Terminal 1
npm run android    # Terminal 2
```

## Phase 2 Configuration

### Background Monitoring
1. Open **Settings** → enable **Background monitoring**
2. Grants foreground service + listens for new package installs
3. Falls back to 15-minute periodic scans via Background Fetch

### Admin PIN
1. **Settings** → **Manage Admin PIN**
2. Set a 4–6 digit PIN
3. Settings and Enrollment from Home require PIN unlock

### Remote Policy
Host a JSON file (see `docs/sample-policy.json`):

```json
{
  "version": 2,
  "allowedInstallers": ["com.android.vending", "com.google.android.packageinstaller"],
  "blockSideloading": true
}
```

Enter the URL in **Settings** → **Fetch & Apply Policy**.

### MDM Enrollment
1. **Home** → **MDM Enrollment** (PIN required if set)
2. Enter enrollment code and optional server URL
3. Server should accept `POST /enroll` with `{ deviceId, enrollmentCode, platform }`
4. Response may include `{ organizationName, policyUrl }`

### Firebase Policy Push (optional)
1. Create Firebase project and add `google-services.json` to `android/app/`
2. `npm install @react-native-firebase/app @react-native-firebase/messaging`
3. Update `FirebasePolicyService.ts` to use real FCM imports
4. Send FCM data message: `{ "type": "policy_update", "allowedInstallers": "[...]" }`

### Export Reports
**Settings** → Reports → Export JSON / Text / PDF

## Permissions

| Permission | Purpose |
|------------|---------|
| `QUERY_ALL_PACKAGES` | List installed apps |
| `POST_NOTIFICATIONS` | Security alerts |
| `RECEIVE_BOOT_COMPLETED` | Resume monitoring after reboot |
| `FOREGROUND_SERVICE` | Active monitor notification |
| `WAKE_LOCK` | Background fetch |

## Compliance Logic

| Installer | Status |
|-----------|--------|
| `com.android.vending` | Authorized (Play Store) |
| `com.google.android.packageinstaller` | Authorized |
| Remote policy installers | Authorized if in policy |
| Whitelisted packages | Always authorized |
| `null` / empty (non-system) | Unauthorized |
| System apps (`FLAG_SYSTEM`) | Excluded from violations |

## Testing Phase 2

1. Enable background monitoring in Settings
2. Sideload an APK: `adb install some-app.apk`
3. You should receive a native notification immediately
4. Set admin PIN and verify Settings is locked from Home
5. Export PDF report from Settings

## License

Internal / educational use — Cyber Security project.
