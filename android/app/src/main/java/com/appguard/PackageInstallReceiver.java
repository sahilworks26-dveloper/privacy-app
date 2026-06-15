package com.appguard;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class PackageInstallReceiver extends BroadcastReceiver {

    private static final String TAG = "PackageInstallReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        if (!Intent.ACTION_PACKAGE_ADDED.equals(intent.getAction())) {
            return;
        }

        if (intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)) {
            return;
        }

        if (!AppGuardPrefs.isMonitoringEnabled(context)) {
            return;
        }

        if (intent.getData() == null) {
            return;
        }

        String packageName = intent.getData().getSchemeSpecificPart();
        if (packageName == null || packageName.equals(context.getPackageName())) {
            return;
        }

        AppComplianceChecker checker = new AppComplianceChecker(context);
        AppComplianceChecker.ComplianceResult result = checker.checkPackage(packageName);

        Log.i(TAG, "Package installed: " + packageName + " authorized=" + result.isAuthorized);

        if (!result.isAuthorized && !result.isSystemApp && AppGuardPrefs.isNotifyEnabled(context)) {
            NotificationHelper.showUnauthorizedInstallNotification(
                    context,
                    result.appName,
                    result.packageName);
        }
    }
}
