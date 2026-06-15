import React, {useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppCard} from '../components/AppCard';
import {ScanButton} from '../components/ScanButton';
import {useInstalledApps} from '../hooks/useInstalledApps';
import {openAppSettings} from '../services/AppScanService';
import {COLORS} from '../utils/constants';
import type {InstalledApp} from '../types/app';
import type {UnauthorizedAppsNavigationProp} from '../types/navigation';

interface UnauthorizedAppsScreenProps {
  navigation: UnauthorizedAppsNavigationProp;
}

export function UnauthorizedAppsScreen({}: UnauthorizedAppsScreenProps): React.JSX.Element {
  const {scanResult, loading, scan} = useInstalledApps(true);

  const handleRemove = useCallback(async (app: InstalledApp) => {
    await openAppSettings(app.packageName);
  }, []);

  const unauthorized = scanResult?.unauthorized ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>⚠️ Unauthorized Apps Detected</Text>
        <Text style={styles.warning}>
          These apps were not installed from Google Play Store. Remove them to
          restore compliance.
        </Text>
        <ScanButton onPress={scan} loading={loading} label="Rescan" />
      </View>

      {unauthorized.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>All clear!</Text>
          <Text style={styles.emptyText}>
            No unauthorized apps detected on this device.
          </Text>
        </View>
      ) : (
        <FlatList
          data={unauthorized}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <AppCard
              app={item}
              showBadge={false}
              onRemovePress={handleRemove}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  warning: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    padding: 20,
    paddingTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
