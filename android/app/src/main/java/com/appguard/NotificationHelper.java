package com.appguard;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public final class NotificationHelper {

    private static final String CHANNEL_ID = "appguard-alerts";
    private static final int NOTIFICATION_ID_BASE = 9000;

    private NotificationHelper() {}

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "AppGuard Security Alerts",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Alerts when unauthorized apps are installed");
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public static void showUnauthorizedInstallNotification(
            Context context,
            String appName,
            String packageName) {
        ensureChannel(context);

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.putExtra("navigateTo", "UnauthorizedApps");
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                packageName.hashCode(),
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("⚠️ Unauthorized App Installed")
                .setContentText(appName + " was installed from an unknown source")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        NotificationManagerCompat.from(context)
                .notify(NOTIFICATION_ID_BASE + Math.abs(packageName.hashCode() % 1000), builder.build());
    }
}
