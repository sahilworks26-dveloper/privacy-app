package com.appguard;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.InstallSourceInfo;
import android.content.pm.PackageManager;
import android.os.Build;

import java.util.Set;

public class AppComplianceChecker {

    private final Context context;
    private final PackageManager packageManager;

    public AppComplianceChecker(Context context) {
        this.context = context.getApplicationContext();
        this.packageManager = this.context.getPackageManager();
    }

    public static class ComplianceResult {
        public final String packageName;
        public final String appName;
        public final String installerPackage;
        public final boolean isSystemApp;
        public final boolean isAuthorized;

        public ComplianceResult(
                String packageName,
                String appName,
                String installerPackage,
                boolean isSystemApp,
                boolean isAuthorized) {
            this.packageName = packageName;
            this.appName = appName;
            this.installerPackage = installerPackage;
            this.isSystemApp = isSystemApp;
            this.isAuthorized = isAuthorized;
        }
    }

    public ComplianceResult checkPackage(String packageName) {
        try {
            ApplicationInfo appInfo = packageManager.getApplicationInfo(packageName, 0);
            CharSequence label = packageManager.getApplicationLabel(appInfo);
            String appName = label != null ? label.toString() : packageName;
            boolean isSystemApp = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
            String installerPackage = getInstallerPackageName(packageName);
            boolean isAuthorized = isAuthorized(packageName, installerPackage, isSystemApp);
            return new ComplianceResult(
                    packageName,
                    appName,
                    installerPackage != null ? installerPackage : "",
                    isSystemApp,
                    isAuthorized);
        } catch (PackageManager.NameNotFoundException e) {
            return new ComplianceResult(packageName, packageName, "", false, true);
        }
    }

    private boolean isAuthorized(String packageName, String installerPackage, boolean isSystemApp) {
        if (AppGuardPrefs.isWhitelisted(context, packageName)) {
            return true;
        }
        if (isSystemApp) {
            return true;
        }
        if (installerPackage == null || installerPackage.isEmpty()) {
            return false;
        }
        Set<String> allowed = AppGuardPrefs.getAllowedInstallersFromPolicy(context);
        return allowed.contains(installerPackage);
    }

    private String getInstallerPackageName(String packageName) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                InstallSourceInfo sourceInfo = packageManager.getInstallSourceInfo(packageName);
                if (sourceInfo != null) {
                    String initiating = sourceInfo.getInitiatingPackageName();
                    if (initiating != null && !initiating.isEmpty()) {
                        return initiating;
                    }
                    String installing = sourceInfo.getInstallingPackageName();
                    if (installing != null && !installing.isEmpty()) {
                        return installing;
                    }
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                return packageManager.getInstallerPackageName(packageName);
            }
        } catch (PackageManager.NameNotFoundException ignored) {
            return null;
        }
        return null;
    }
}
