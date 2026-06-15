import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  getWhitelist,
  scanInstalledApps,
} from '../services/AppScanService';
import {STORAGE_KEYS, COLORS} from '../utils/constants';
import type {SettingsScreenNavigationProp} from '../types/navigation';

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export function SettingsScreen({}: SettingsScreenProps): React.JSX.Element {
  const [backgroundMonitoring, setBackgroundMonitoring] = useState(false);
  const [notifyUnauthorized, setNotifyUnauthorized] = useState(true);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>([]);

  const loadSettings = useCallback(async () => {
    const [bg, notify, list] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_MONITORING),
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFY_UNAUTHORIZED),
      getWhitelist(),
    ]);
    setBackgroundMonitoring(bg === 'true');
    setNotifyUnauthorized(notify !== 'false');
    setWhitelist(list);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleBackground = async (value: boolean) => {
    setBackgroundMonitoring(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.BACKGROUND_MONITORING,
      value.toString(),
    );
    if (value) {
      Alert.alert(
        'Background Monitoring',
        'Full background install monitoring (BroadcastReceiver) is planned for Phase 2. The preference has been saved.',
      );
    }
  };

  const toggleNotify = async (value: boolean) => {
    setNotifyUnauthorized(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFY_UNAUTHORIZED,
      value.toString(),
    );
  };

  const addToWhitelist = async () => {
    const pkg = whitelistInput.trim();
    if (!pkg) {
      return;
    }
    if (whitelist.includes(pkg)) {
      Alert.alert('Already whitelisted', `${pkg} is already on the safe list.`);
      return;
    }
    const updated = [...whitelist, pkg];
    setWhitelist(updated);
    setWhitelistInput('');
    await AsyncStorage.setItem(
      STORAGE_KEYS.WHITELIST,
      JSON.stringify(updated),
    );
  };

  const removeFromWhitelist = async (pkg: string) => {
    const updated = whitelist.filter(item => item !== pkg);
    setWhitelist(updated);
    await AsyncStorage.setItem(
      STORAGE_KEYS.WHITELIST,
      JSON.stringify(updated),
    );
  };

  const exportReport = async () => {
    try {
      const result = await scanInstalledApps();
      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalUserApps: result.totalScanned,
          compliant: result.compliantCount,
          unauthorized: result.unauthorized.length,
        },
        apps: result.apps.map(app => ({
          appName: app.appName,
          packageName: app.packageName,
          installer: app.installerPackage || 'unknown',
          isSystemApp: app.isSystemApp,
          isAuthorized: app.isAuthorized,
        })),
      };

      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: 'AppGuard Compliance Report',
      });
    } catch {
      Alert.alert('Export failed', 'Could not generate compliance report.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitoring</Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>Enable background monitoring</Text>
              <Text style={styles.hint}>Phase 2 — saves preference only</Text>
            </View>
            <Switch
              value={backgroundMonitoring}
              onValueChange={toggleBackground}
              trackColor={{false: COLORS.border, true: COLORS.green}}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>Notify on unauthorized install</Text>
              <Text style={styles.hint}>Alert after manual scans</Text>
            </View>
            <Switch
              value={notifyUnauthorized}
              onValueChange={toggleNotify}
              trackColor={{false: COLORS.border, true: COLORS.green}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Whitelist an App</Text>
          <Text style={styles.hint}>
            Package names on this list are treated as authorized.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="com.example.app"
            placeholderTextColor={COLORS.textSecondary}
            value={whitelistInput}
            onChangeText={setWhitelistInput}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={addToWhitelist}>
            <Text style={styles.buttonText}>Add to Whitelist</Text>
          </TouchableOpacity>
          {whitelist.map(pkg => (
            <View key={pkg} style={styles.whitelistItem}>
              <Text style={styles.whitelistText}>{pkg}</Text>
              <TouchableOpacity onPress={() => removeFromWhitelist(pkg)}>
                <Text style={styles.removeLink}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>
          <TouchableOpacity style={styles.button} onPress={exportReport}>
            <Text style={styles.buttonText}>Export Compliance Report (JSON)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.phaseNote}>
          Phase 2 (not yet implemented): real-time BroadcastReceiver monitoring,
          admin PIN lock, PDF export, Firebase policy push, MDM enrollment.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  whitelistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  whitelistText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  removeLink: {
    color: COLORS.red,
    fontWeight: '600',
  },
  phaseNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
