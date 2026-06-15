import React, {useState} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../utils/constants';
import {
  changeAdminPin,
  clearAdminPin,
  isPinSet,
  setAdminPin,
  verifyAdminPin,
} from '../services/PinService';

export function SetPinScreen(): React.JSX.Element {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPin, setHasPin] = useState(false);

  React.useEffect(() => {
    isPinSet().then(setHasPin);
  }, []);

  const handleSave = async () => {
    try {
      if (hasPin) {
        await changeAdminPin(currentPin, newPin);
      } else {
        if (newPin !== confirmPin) {
          Alert.alert('PIN mismatch', 'New PIN and confirmation do not match.');
          return;
        }
        await setAdminPin(newPin);
      }
      Alert.alert('Success', 'Admin PIN updated.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setHasPin(true);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Could not update PIN',
      );
    }
  };

  const handleClear = async () => {
    if (hasPin) {
      const valid = await verifyAdminPin(currentPin);
      if (!valid) {
        Alert.alert('Error', 'Current PIN is incorrect.');
        return;
      }
    }
    await clearAdminPin();
    setHasPin(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    Alert.alert('PIN removed', 'Settings are no longer PIN-protected.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.card}>
        <Text style={styles.title}>Admin PIN</Text>
        <Text style={styles.hint}>
          Protect settings and enrollment with a 4–6 digit PIN.
        </Text>

        {hasPin && (
          <TextInput
            style={styles.input}
            value={currentPin}
            onChangeText={t => setCurrentPin(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="Current PIN"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            secureTextEntry
          />
        )}

        <TextInput
          style={styles.input}
          value={newPin}
          onChangeText={t => setNewPin(t.replace(/\D/g, '').slice(0, 6))}
          placeholder={hasPin ? 'New PIN' : 'PIN (4–6 digits)'}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="number-pad"
          secureTextEntry
        />

        {!hasPin && (
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={t => setConfirmPin(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="Confirm PIN"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            secureTextEntry
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>
            {hasPin ? 'Change PIN' : 'Set PIN'}
          </Text>
        </TouchableOpacity>

        {hasPin && (
          <TouchableOpacity style={styles.dangerButton} onPress={handleClear}>
            <Text style={styles.dangerText}>Remove PIN Protection</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontSize: 13,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    marginTop: 4,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  dangerButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  dangerText: {
    color: COLORS.red,
    fontWeight: '600',
  },
});
