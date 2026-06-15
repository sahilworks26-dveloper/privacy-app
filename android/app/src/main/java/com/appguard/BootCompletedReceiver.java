package com.appguard;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootCompletedReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            return;
        }

        if (AppGuardPrefs.isMonitoringEnabled(context)) {
            InstallMonitorService.start(context);
        }
    }
}
