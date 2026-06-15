package com.appguard;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.InstallSourceInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;

public class InstalledAppsModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "InstalledApps";

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
            AppComplianceChecker checker = new AppComplianceChecker(getReactApplicationContext());

            for (ApplicationInfo appInfo : packages) {
                if (appInfo.packageName.equals(selfPackage)) {
                    continue;
                }

                AppComplianceChecker.ComplianceResult compliance =
                        checker.checkPackage(appInfo.packageName);

                WritableMap appMap = Arguments.createMap();
                appMap.putString("packageName", compliance.packageName);
                appMap.putString("appName", compliance.appName);
                appMap.putString("installerPackage", compliance.installerPackage);
                appMap.putBoolean("isSystemApp", compliance.isSystemApp);
                appMap.putBoolean("isAuthorized", compliance.isAuthorized);
                appMap.putString("icon", getAppIconBase64(pm, appInfo));

                result.pushMap(appMap);
            }

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("GET_APPS_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getAppInfo(String packageName, Promise promise) {
        try {
            AppComplianceChecker checker = new AppComplianceChecker(getReactApplicationContext());
            AppComplianceChecker.ComplianceResult compliance = checker.checkPackage(packageName);
            WritableMap appMap = Arguments.createMap();
            appMap.putString("packageName", compliance.packageName);
            appMap.putString("appName", compliance.appName);
            appMap.putString("installerPackage", compliance.installerPackage);
            appMap.putBoolean("isSystemApp", compliance.isSystemApp);
            appMap.putBoolean("isAuthorized", compliance.isAuthorized);
            promise.resolve(appMap);
        } catch (Exception e) {
            promise.reject("GET_APP_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void syncMonitoringSettings(boolean monitoringEnabled, boolean notifyEnabled, Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            AppGuardPrefs.setMonitoringEnabled(context, monitoringEnabled);
            AppGuardPrefs.setNotifyEnabled(context, notifyEnabled);

            if (monitoringEnabled) {
                InstallMonitorService.start(context);
            } else {
                InstallMonitorService.stop(context);
            }

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SYNC_MONITORING_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void syncWhitelist(String whitelistJson, Promise promise) {
        try {
            AppGuardPrefs.setWhitelistJson(getReactApplicationContext(), whitelistJson);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SYNC_WHITELIST_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void syncRemotePolicy(String allowedInstallersJson, Promise promise) {
        try {
            AppGuardPrefs.setRemoteAllowedInstallers(getReactApplicationContext(), allowedInstallersJson);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SYNC_POLICY_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        try {
            String androidId = Settings.Secure.getString(
                    getReactApplicationContext().getContentResolver(),
                    Settings.Secure.ANDROID_ID);
            promise.resolve(androidId != null ? androidId : "unknown");
        } catch (Exception e) {
            promise.reject("DEVICE_ID_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void exportReportPdf(String reportText, Promise promise) {
        try {
            File cacheDir = getReactApplicationContext().getCacheDir();
            File pdfFile = new File(cacheDir, "appguard-report-" + System.currentTimeMillis() + ".pdf");

            PdfDocument document = new PdfDocument();
            Paint paint = new Paint();
            paint.setTextSize(11f);
            paint.setAntiAlias(true);

            int pageWidth = 595;
            int pageHeight = 842;
            int margin = 40;
            int lineHeight = 16;
            int y = margin;
            int pageNumber = 1;

            PdfDocument.Page page = startPdfPage(document, pageWidth, pageHeight, pageNumber);
            Canvas canvas = page.getCanvas();

            String[] lines = reportText.split("\n");
            for (String line : lines) {
                if (y > pageHeight - margin) {
                    document.finishPage(page);
                    pageNumber++;
                    page = startPdfPage(document, pageWidth, pageHeight, pageNumber);
                    canvas = page.getCanvas();
                    y = margin;
                }
                canvas.drawText(line, margin, y, paint);
                y += lineHeight;
            }

            document.finishPage(page);

            try (FileOutputStream outputStream = new FileOutputStream(pdfFile)) {
                document.writeTo(outputStream);
            }
            document.close();

            String authority = getReactApplicationContext().getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(getReactApplicationContext(), authority, pdfFile);

            WritableMap result = Arguments.createMap();
            result.putString("filePath", pdfFile.getAbsolutePath());
            result.putString("contentUri", contentUri.toString());
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("PDF_EXPORT_ERROR", e.getMessage(), e);
        }
    }

    private PdfDocument.Page startPdfPage(PdfDocument document, int width, int height, int pageNumber) {
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(width, height, pageNumber).create();
        return document.startPage(pageInfo);
    }

    @ReactMethod
    public void shareFile(String contentUri, String mimeType, Promise promise) {
        try {
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType(mimeType);
            shareIntent.putExtra(Intent.EXTRA_STREAM, Uri.parse(contentUri));
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(shareIntent, "Share AppGuard Report");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(chooser);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SHARE_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void consumePendingNavigation(Promise promise) {
        String route = MainActivity.pendingRoute;
        MainActivity.pendingRoute = null;
        promise.resolve(route);
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

