import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {StatusBadge} from './StatusBadge';
import {COLORS} from '../utils/constants';
import {getInstallerLabel} from '../services/AppScanService';
import type {InstalledApp} from '../types/app';

interface AppCardProps {
  app: InstalledApp;
  showBadge?: boolean;
  onRemovePress?: (app: InstalledApp) => void;
}

export function AppCard({
  app,
  showBadge = true,
  onRemovePress,
}: AppCardProps): React.JSX.Element {
  const iconUri = app.icon ? `data:image/png;base64,${app.icon}` : undefined;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {iconUri ? (
          <Image source={{uri: iconUri}} style={styles.icon} />
        ) : (
          <View style={[styles.icon, styles.iconPlaceholder]} />
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {app.appName}
          </Text>
          <Text style={styles.package} numberOfLines={1}>
            {app.packageName}
          </Text>
          <Text style={styles.installer}>
            Source: {getInstallerLabel(app.installerPackage)}
          </Text>
          {showBadge && (
            <StatusBadge
              authorized={app.isAuthorized}
              isSystemApp={app.isSystemApp}
            />
          )}
        </View>
      </View>
      {onRemovePress && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemovePress(app)}>
          <Text style={styles.removeText}>How to Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  iconPlaceholder: {
    backgroundColor: COLORS.border,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  package: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  installer: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  removeButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.red,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});
