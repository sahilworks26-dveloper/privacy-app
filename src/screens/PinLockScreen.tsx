import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../utils/constants';
import {verifyAdminPin} from '../services/PinService';
import type {PinLockScreenNavigationProp, PinLockScreenRouteProp} from '../types/navigation';

interface PinLockScreenProps {
  navigation: PinLockScreenNavigationProp;
  route: PinLockScreenRouteProp;
}

export function PinLockScreen({
  navigation,
  route,
}: PinLockScreenProps): React.JSX.Element {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const redirectTo = route.params.redirectTo;

  const handleSubmit = async () => {
    const valid = await verifyAdminPin(pin);
    if (!valid) {
      setError('Incorrect PIN');
      setPin('');
      return;
    }
    navigation.replace(redirectTo);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Admin PIN Required</Text>
        <Text style={styles.subtitle}>
          Enter your PIN to access {redirectTo === 'Settings' ? 'settings' : 'enrollment'}.
        </Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={text => {
            setPin(text.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          placeholder="••••"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  error: {
    color: COLORS.red,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  cancel: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
