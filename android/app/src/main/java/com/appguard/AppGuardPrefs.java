package com.appguard;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.HashSet;
import java.util.Set;

public final class AppGuardPrefs {

    private static final String PREFS_NAME = "appguard_prefs";
    private static final String KEY_BACKGROUND_MONITORING = "background_monitoring";
    private static final String KEY_NOTIFY_UNAUTHORIZED = "notify_unauthorized";
    private static final String KEY_WHITELIST = "whitelist_json";

    private AppGuardPrefs() {}

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static void setMonitoringEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_BACKGROUND_MONITORING, enabled).apply();
    }

    public static boolean isMonitoringEnabled(Context context) {
        return prefs(context).getBoolean(KEY_BACKGROUND_MONITORING, false);
    }

    public static void setNotifyEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_NOTIFY_UNAUTHORIZED, enabled).apply();
    }

    public static boolean isNotifyEnabled(Context context) {
        return prefs(context).getBoolean(KEY_NOTIFY_UNAUTHORIZED, true);
    }

    public static void setWhitelistJson(Context context, String whitelistJson) {
        prefs(context).edit().putString(KEY_WHITELIST, whitelistJson != null ? whitelistJson : "[]").apply();
    }

    public static boolean isWhitelisted(Context context, String packageName) {
        String raw = prefs(context).getString(KEY_WHITELIST, "[]");
        try {
            JSONArray array = new JSONArray(raw);
            for (int i = 0; i < array.length(); i++) {
                if (packageName.equals(array.optString(i))) {
                    return true;
                }
            }
        } catch (JSONException ignored) {
            return false;
        }
        return false;
    }

    public static Set<String> getAllowedInstallersFromPolicy(Context context) {
        String raw = prefs(context).getString("remote_allowed_installers", null);
        Set<String> installers = new HashSet<>();
        installers.add("com.android.vending");
        installers.add("com.google.android.packageinstaller");
        if (raw == null || raw.isEmpty()) {
            return installers;
        }
        try {
            JSONArray array = new JSONArray(raw);
            for (int i = 0; i < array.length(); i++) {
                String value = array.optString(i);
                if (!value.isEmpty()) {
                    installers.add(value);
                }
            }
        } catch (JSONException ignored) {
            // keep defaults
        }
        return installers;
    }

    public static void setRemoteAllowedInstallers(Context context, String installersJson) {
        prefs(context).edit().putString("remote_allowed_installers", installersJson).apply();
    }
}
