import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
  syncWhitelistToNative,
} from '../services/AppScanService';
import {
  setBackgroundMonitoring,
  syncMonitoringToNative,
} from '../services/BackgroundMonitorService';
import {
  fetchRemotePolicy,
  getPolicyUrl,
  getStoredPolicy,
  setPolicyUrl,
} from '../services/PolicyService';
import {
  exportJsonReport,
  exportPdfReport,
  exportTextReport,
} from '../services/ReportService';
import {requestNotificationPermission} from '../services/NotificationService';
import {STORAGE_KEYS, COLORS} from '../utils/constants';
import type {SettingsScreenNavigationProp} from '../types/navigation';
import type {RemotePolicy} from '../types/app';

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export function SettingsScreen({
  navigation,
}: SettingsScreenProps): React.JSX.Element {
  const [backgroundMonitoring, setBackgroundMonitoring] = useState(false);
  const [notifyUnauthorized, setNotifyUnauthorized] = useState(true);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [policyUrl, setPolicyUrlInput] = useState('');
  const [policy, setPolicy] = useState<RemotePolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSettings = useCallback(async () => {
    const [bg, notify, list, url, storedPolicy] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_MONITORING),
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFY_UNAUTHORIZED),
      getWhitelist(),
      getPolicyUrl(),
      getStoredPolicy(),
    ]);
    setBackgroundMonitoring(bg === 'true');
    setNotifyUnauthorized(notify !== 'false');
    setWhitelist(list);
    setPolicyUrlInput(url);
    setPolicy(storedPolicy);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleBackground = async (value: boolean) => {
    setBackgroundMonitoring(value);
    await setBackgroundMonitoring(value);
    if (value) {
      await requestNotificationPermission();
      Alert.alert(
        'Monitoring Active',
        'AppGuard will monitor new installs via BroadcastReceiver and periodic background checks.',
      );
    }
  };

  const toggleNotify = async (value: boolean) => {
    setNotifyUnauthorized(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFY_UNAUTHORIZED,
      value.toString(),
    );
    await syncMonitoringToNative();
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
    await syncWhitelistToNative();
  };

  const removeFromWhitelist = async (pkg: string) => {
    const updated = whitelist.filter(item => item !== pkg);
    setWhitelist(updated);
    await AsyncStorage.setItem(
      STORAGE_KEYS.WHITELIST,
      JSON.stringify(updated),
    );
    await syncWhitelistToNative();
  };

  const handleFetchPolicy = async () => {
    setPolicyLoading(true);
    try {
      await setPolicyUrl(policyUrl);
      const remote = await fetchRemotePolicy(policyUrl);
      setPolicy(remote);
      Alert.alert('Policy updated', `Policy v${remote.version} applied.`);
    } catch (err) {
      Alert.alert(
        'Policy fetch failed',
        err instanceof Error ? err.message : 'Could not fetch policy',
      );
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'text' | 'pdf') => {
    setExporting(true);
    try {
      const result = await scanInstalledApps();
      if (format === 'json') {
        await exportJsonReport(result);
      } else if (format === 'text') {
        await exportTextReport(result);
      } else {
        await exportPdfReport(result);
      }
    } catch {
      Alert.alert('Export failed', 'Could not generate compliance report.');
    } finally {
      setExporting(false);
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
              <Text style={styles.hint}>
                BroadcastReceiver + 15 min periodic scan
              </Text>
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
              <Text style={styles.hint}>Real-time and background alerts</Text>
            </View>
            <Switch
              value={notifyUnauthorized}
              onValueChange={toggleNotify}
              trackColor={{false: COLORS.border, true: COLORS.green}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remote Policy</Text>
          <Text style={styles.hint}>
            Fetch allowed installers from your policy server (JSON).
          </Text>
          <TextInput
            style={styles.input}
            value={policyUrl}
            onChangeText={setPolicyUrlInput}
            placeholder="https://policy.example.com/appguard.json"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleFetchPolicy}
            disabled={policyLoading}>
            {policyLoading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Fetch & Apply Policy</Text>
            )}
          </TouchableOpacity>
          {policy && (
            <Text style={styles.policyMeta}>
              Active policy v{policy.version} ·{' '}
              {policy.allowedInstallers.length} allowed installers
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SetPin')}>
            <Text style={styles.buttonText}>Manage Admin PIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryBtn]}
            onPress={() => navigation.navigate('Enrollment')}>
            <Text style={styles.buttonText}>MDM Enrollment</Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleExport('json')}
            disabled={exporting}>
            <Text style={styles.buttonText}>Export JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryBtn]}
            onPress={() => handleExport('text')}
            disabled={exporting}>
            <Text style={styles.buttonText}>Export Text</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryBtn]}
            onPress={() => handleExport('pdf')}
            disabled={exporting}>
            <Text style={styles.buttonText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
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
  secondaryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.green,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  policyMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 10,
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
});
