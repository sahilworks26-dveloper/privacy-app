package com.appguard;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class InstallMonitorService extends Service {

    private static final String CHANNEL_ID = "appguard-monitor";
    private static final int NOTIFICATION_ID = 1001;

    public static void start(Context context) {
        Intent intent = new Intent(context, InstallMonitorService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, InstallMonitorService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        NotificationHelper.ensureChannel(this);
        createMonitorChannel();
        startForeground(NOTIFICATION_ID, buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!AppGuardPrefs.isMonitoringEnabled(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createMonitorChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.NotificationChannel channel = new android.app.NotificationChannel(
                    CHANNEL_ID,
                    "AppGuard Monitor",
                    android.app.NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Shows when AppGuard is monitoring app installs");
            android.app.NotificationManager manager = getSystemService(android.app.NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("AppGuard Active")
                .setContentText("Monitoring new app installations")
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
}
