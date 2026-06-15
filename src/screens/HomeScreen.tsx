import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ScanButton} from '../components/ScanButton';
import {useInstalledApps} from '../hooks/useInstalledApps';
import {getComplianceColor} from '../services/AppScanService';
import {COLORS} from '../utils/constants';
import type {HomeScreenNavigationProp} from '../types/navigation';

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export function HomeScreen({navigation}: HomeScreenProps): React.JSX.Element {
  const {scanResult, loading, error, scan, lastScanDisplay} =
    useInstalledApps(true);

  const total = scanResult?.totalScanned ?? 0;
  const compliant = scanResult?.compliantCount ?? 0;
  const unauthorizedCount = scanResult?.unauthorized.length ?? 0;
  const scoreColor = getComplianceColor(compliant, total);
  const compliancePercent =
    total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Icon name="shield-check" size={32} color={COLORS.green} />
          <Text style={styles.title}>AppGuard</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}>
            <Icon name="cog" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Play Store compliance monitor for your device
        </Text>

        <View style={styles.scoreCard}>
          <View style={[styles.scoreCircle, {borderColor: scoreColor}]}>
            {loading && !scanResult ? (
              <ActivityIndicator size="large" color={scoreColor} />
            ) : (
              <>
                <Text style={[styles.scoreValue, {color: scoreColor}]}>
                  {compliant}/{total}
                </Text>
                <Text style={styles.scoreLabel}>compliant</Text>
              </>
            )}
          </View>
          <Text style={[styles.percentText, {color: scoreColor}]}>
            {compliancePercent}% compliant
          </Text>
          {unauthorizedCount > 0 && (
            <Text style={styles.warningText}>
              {unauthorizedCount} unauthorized app
              {unauthorizedCount !== 1 ? 's' : ''} detected
            </Text>
          )}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <ScanButton onPress={scan} loading={loading} />
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              unauthorizedCount === 0 && styles.secondaryDisabled,
            ]}
            onPress={() => navigation.navigate('UnauthorizedApps')}
            disabled={unauthorizedCount === 0}>
            <Icon
              name="alert-circle-outline"
              size={20}
              color={COLORS.textPrimary}
            />
            <Text style={styles.secondaryLabel}>View Unauthorized</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('AllApps')}>
          <Text style={styles.linkText}>Browse all installed apps →</Text>
        </TouchableOpacity>

        <Text style={styles.lastScan}>Last scan: {lastScanDisplay}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  settingsButton: {
    padding: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 28,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '700',
  },
  warningText: {
    color: COLORS.red,
    marginTop: 8,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryDisabled: {
    opacity: 0.4,
  },
  secondaryLabel: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  lastScan: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 13,
  },
});
