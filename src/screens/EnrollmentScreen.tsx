import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../utils/constants';
import {
  enrollDevice,
  getDeviceId,
  getEnrollmentServer,
  getEnrollmentStatus,
  setEnrollmentServer,
  unenrollDevice,
} from '../services/EnrollmentService';
import type {EnrollmentStatus} from '../types/app';

export function EnrollmentScreen(): React.JSX.Element {
  const [status, setStatus] = useState<EnrollmentStatus | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [id, enrollment, server] = await Promise.all([
      getDeviceId(),
      getEnrollmentStatus(),
      getEnrollmentServer(),
    ]);
    setDeviceId(id);
    setStatus(enrollment);
    setServerUrl(server);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async () => {
    if (!enrollmentCode.trim()) {
      Alert.alert('Missing code', 'Enter an enrollment code.');
      return;
    }
    setLoading(true);
    try {
      await setEnrollmentServer(serverUrl);
      const result = await enrollDevice(
        enrollmentCode.trim(),
        organizationName.trim() || undefined,
      );
      setStatus(result);
      Alert.alert(
        'Enrolled',
        result.organizationName
          ? `Device enrolled under ${result.organizationName}`
          : 'Device enrolled successfully.',
      );
    } catch (err) {
      Alert.alert(
        'Enrollment failed',
        err instanceof Error ? err.message : 'Could not enroll device',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    Alert.alert('Unenroll device?', 'This removes MDM enrollment from this device.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Unenroll',
        style: 'destructive',
        onPress: async () => {
          await unenrollDevice();
          await load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Icon name="cellphone-link" size={40} color={COLORS.accent} />
          <Text style={styles.title}>MDM Enrollment</Text>
          <Text style={styles.subtitle}>
            Register this device with your organization to receive remote policy
            updates.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Device ID</Text>
          <Text style={styles.deviceId}>{deviceId}</Text>

          <Text style={styles.label}>Enrollment Server URL (optional)</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="https://mdm.example.com/api"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
          />

          {status?.enrolled ? (
            <View style={styles.enrolledBox}>
              <Icon name="check-circle" size={24} color={COLORS.green} />
              <View style={styles.enrolledInfo}>
                <Text style={styles.enrolledTitle}>Enrolled</Text>
                <Text style={styles.enrolledText}>
                  {status.organizationName ?? 'Organization'}
                </Text>
                <Text style={styles.enrolledMeta}>
                  Since {status.enrolledAt ? new Date(status.enrolledAt).toLocaleString() : '—'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Enrollment Code</Text>
              <TextInput
                style={styles.input}
                value={enrollmentCode}
                onChangeText={setEnrollmentCode}
                placeholder="Enter code from admin"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="characters"
              />
              <Text style={styles.label}>Organization Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder="Acme Corp"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleEnroll}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={COLORS.textPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Enroll Device</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {status?.enrolled && (
            <TouchableOpacity style={styles.unenrollButton} onPress={handleUnenroll}>
              <Text style={styles.unenrollText}>Unenroll Device</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.note}>
          Without a server URL, enrollment is saved locally. With a server, the
          device POSTs to /enroll and may receive a policy URL in response.
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
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  deviceId: {
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  enrolledBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  enrolledInfo: {
    flex: 1,
  },
  enrolledTitle: {
    color: COLORS.green,
    fontWeight: '700',
    fontSize: 16,
  },
  enrolledText: {
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  enrolledMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  unenrollButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  unenrollText: {
    color: COLORS.red,
    fontWeight: '600',
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});
