# AppGuard

**AppGuard** is an MDM-lite Android app built with React Native that enforces a simple policy: only apps installed from the Google Play Store are considered compliant. Apps sideloaded via APK or unknown sources are detected and surfaced to the user.

## Features (Phase 1 — MVP)

- Native Android module scans all installed apps and reads installer source (`getInstallSourceInfo` on API 30+, `getInstallerPackageName` on older APIs)
- Dashboard with compliance score and manual scan
- Unauthorized apps list with "How to Remove" → opens Android app settings
- All apps browser with search and filter tabs (All / Authorized / Unauthorized)
- Dark-themed UI
- Local notifications when unauthorized apps are found (after scan)
- Settings: notification toggle, whitelist, JSON export report

## Phase 2 (planned)

- Background monitoring via `BroadcastReceiver` (`ACTION_PACKAGE_ADDED`)
- Admin PIN lock for settings
- PDF export
- Firebase remote policy
- MDM enrollment flow

## Tech Stack

- React Native 0.76.9 (CLI, TypeScript)
- Java native module (`InstalledAppsModule`)
- React Navigation (Stack)
- AsyncStorage, Notifee, react-native-vector-icons
- react-native-background-fetch (installed for Phase 2)

## Project Structure

```
AppGuard/
├── android/app/src/main/java/com/appguard/
│   ├── InstalledAppsModule.java
│   └── InstalledAppsPackage.java
├── src/
│   ├── screens/          # Home, Unauthorized, AllApps, Settings
│   ├── components/       # AppCard, StatusBadge, ScanButton
│   ├── services/         # AppScanService, NotificationService
│   ├── hooks/            # useInstalledApps
│   └── utils/            # constants, theme colors
└── App.tsx
```

## Prerequisites

- Node.js 18+
- JDK 17
- Android Studio with SDK 34+
- Physical Android device (recommended for accurate installer data)

## Setup

```bash
cd AppGuard
npm install
```

## Run on Android

1. Enable USB debugging on your device
2. Connect device via USB
3. Start Metro and build:

```bash
npm start
npm run android
```

## Permissions

The app requests:

- `QUERY_ALL_PACKAGES` — list all installed apps (required for scanning)
- `POST_NOTIFICATIONS` — alert on unauthorized apps
- `RECEIVE_BOOT_COMPLETED` / `FOREGROUND_SERVICE` — reserved for Phase 2 background monitoring

> **Note:** `QUERY_ALL_PACKAGES` requires a privacy policy and Play Store approval for public distribution. Suitable for internal/enterprise MVP use.

## How Compliance Works

| Installer | Status |
|-----------|--------|
| `com.android.vending` | Authorized (Play Store) |
| `com.google.android.packageinstaller` | Authorized (system updates) |
| `null` / empty | Unauthorized (sideloaded/ADB) unless system app |
| System apps (`FLAG_SYSTEM`) | Excluded from unauthorized list |

Whitelisted package names (Settings) are always treated as authorized.

## Testing Tips

- Install a test APK via `adb install app.apk` — it should appear as unauthorized
- Play Store apps show installer `com.android.vending`
- Test on a **real device**; emulators may return incomplete installer metadata

## License

Internal / educational use — Cyber Security project MVP.
