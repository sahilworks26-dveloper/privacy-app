import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../utils/constants';

interface StatusBadgeProps {
  authorized: boolean;
  isSystemApp?: boolean;
}

export function StatusBadge({
  authorized,
  isSystemApp = false,
}: StatusBadgeProps): React.JSX.Element {
  let label = authorized ? '✓ Play Store' : '✗ Unknown Source';
  let backgroundColor: string = authorized ? COLORS.green : COLORS.red;

  if (isSystemApp) {
    label = 'System App';
    backgroundColor = COLORS.accent;
  }

  return (
    <View style={[styles.badge, {backgroundColor}]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});
