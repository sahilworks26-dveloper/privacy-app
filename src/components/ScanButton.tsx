import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../utils/constants';

interface ScanButtonProps {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

export function ScanButton({
  onPress,
  loading = false,
  label = 'Scan Now',
}: ScanButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color={COLORS.textPrimary} />
      ) : (
        <>
          <Icon name="radar" size={20} color={COLORS.textPrimary} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
