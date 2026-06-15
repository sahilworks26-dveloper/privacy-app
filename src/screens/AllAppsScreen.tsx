import React, {useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppCard} from '../components/AppCard';
import {useInstalledApps} from '../hooks/useInstalledApps';
import {COLORS} from '../utils/constants';
import type {InstalledApp} from '../types/app';
import type {AllAppsScreenNavigationProp} from '../types/navigation';

type FilterTab = 'all' | 'authorized' | 'unauthorized';

interface AllAppsScreenProps {
  navigation: AllAppsScreenNavigationProp;
}

export function AllAppsScreen({}: AllAppsScreenProps): React.JSX.Element {
  const {scanResult, loading} = useInstalledApps(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredApps = useMemo(() => {
    const apps = scanResult?.apps.filter(app => !app.isSystemApp) ?? [];
    let result = apps;

    if (filter === 'authorized') {
      result = result.filter(app => app.isAuthorized);
    } else if (filter === 'unauthorized') {
      result = result.filter(app => !app.isAuthorized);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        app =>
          app.appName.toLowerCase().includes(query) ||
          app.packageName.toLowerCase().includes(query),
      );
    }

    return result.sort((a, b) => a.appName.localeCompare(b.appName));
  }, [scanResult, filter, search]);

  const tabs: {key: FilterTab; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'authorized', label: 'Authorized'},
    {key: 'unauthorized', label: 'Unauthorized'},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.controls}>
        <TextInput
          style={styles.search}
          placeholder="Search by app name..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.tabs}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, filter === tab.key && styles.tabActive]}
              onPress={() => setFilter(tab.key)}>
              <Text
                style={[
                  styles.tabText,
                  filter === tab.key && styles.tabTextActive,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.count}>
          {loading ? 'Scanning...' : `${filteredApps.length} apps`}
        </Text>
      </View>

      <FlatList
        data={filteredApps}
        keyExtractor={(item: InstalledApp) => item.packageName}
        contentContainerStyle={styles.list}
        renderItem={({item}) => <AppCard app={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No apps match your filters.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  controls: {
    padding: 20,
    paddingBottom: 8,
    gap: 12,
  },
  search: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  count: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  list: {
    padding: 20,
    paddingTop: 8,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
