package com.appguard;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.InstallSourceInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.ByteArrayOutputStream;
import java.util.Arrays;
import java.util.List;

public class InstalledAppsModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "InstalledApps";
    private static final List<String> ALLOWED_INSTALLERS = Arrays.asList(
            "com.android.vending",
            "com.google.android.packageinstaller"
    );

    public InstalledAppsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = getReactApplicationContext().getPackageManager();
            String selfPackage = getReactApplicationContext().getPackageName();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            WritableArray result = Arguments.createArray();

            for (ApplicationInfo appInfo : packages) {
                if (appInfo.packageName.equals(selfPackage)) {
                    continue;
                }

                WritableMap appMap = Arguments.createMap();
                CharSequence label = pm.getApplicationLabel(appInfo);
                String appName = label != null ? label.toString() : appInfo.packageName;
                boolean isSystemApp = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                String installerPackage = getInstallerPackageName(pm, appInfo.packageName);

                appMap.putString("packageName", appInfo.packageName);
                appMap.putString("appName", appName);
                appMap.putString("installerPackage", installerPackage != null ? installerPackage : "");
                appMap.putBoolean("isSystemApp", isSystemApp);
                appMap.putBoolean("isAuthorized", isAuthorized(installerPackage, isSystemApp));
                appMap.putString("icon", getAppIconBase64(pm, appInfo));

                result.pushMap(appMap);
            }

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("GET_APPS_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void openAppSettings(String packageName, Promise promise) {
        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + packageName));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("OPEN_SETTINGS_ERROR", e.getMessage(), e);
        }
    }

    private String getInstallerPackageName(PackageManager pm, String packageName) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                InstallSourceInfo sourceInfo = pm.getInstallSourceInfo(packageName);
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
                return pm.getInstallerPackageName(packageName);
            }
        } catch (PackageManager.NameNotFoundException ignored) {
            return null;
        }
        return null;
    }

    private boolean isAuthorized(String installerPackage, boolean isSystemApp) {
        if (isSystemApp) {
            return true;
        }
        if (installerPackage == null || installerPackage.isEmpty()) {
            return false;
        }
        return ALLOWED_INSTALLERS.contains(installerPackage);
    }

    private String getAppIconBase64(PackageManager pm, ApplicationInfo appInfo) {
        try {
            Drawable drawable = pm.getApplicationIcon(appInfo);
            Bitmap bitmap;

            if (drawable instanceof BitmapDrawable) {
                BitmapDrawable bitmapDrawable = (BitmapDrawable) drawable;
                if (bitmapDrawable.getBitmap() != null) {
                    bitmap = bitmapDrawable.getBitmap();
                } else {
                    bitmap = drawableToBitmap(drawable);
                }
            } else {
                bitmap = drawableToBitmap(drawable);
            }

            if (bitmap == null) {
                return "";
            }

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
            byte[] bytes = stream.toByteArray();
            return Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }

    private Bitmap drawableToBitmap(Drawable drawable) {
        int width = drawable.getIntrinsicWidth() > 0 ? drawable.getIntrinsicWidth() : 96;
        int height = drawable.getIntrinsicHeight() > 0 ? drawable.getIntrinsicHeight() : 96;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bitmap;
    }
}
