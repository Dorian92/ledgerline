import { View, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import { useRepos, useDb } from '@/data/DbProvider';
import {
  deleteAllJournalData,
  exportTradesCsv,
  parseBackup,
  restoreBackup,
  serializeBackup,
  snapshotBackup,
} from '@/data/backup/service';
import { useRealModeOnly } from '@/features/guards';
import { ScreenHeader, EmptyState } from '@/ui/primitives';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function BackupScreen() {
  const guard = useRealModeOnly();
  const repos = useRepos();
  const { refreshMode } = useDb();

  if (!guard.allowed) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Backup" />
        <Text variant="secondary">{guard.reason}</Text>
      </View>
    );
  }

  const exportJson = async () => {
    const snap = await snapshotBackup(repos);
    const json = serializeBackup(snap);
    const path = `${FileSystem.cacheDirectory}ledgerline-backup.json`;
    await FileSystem.writeAsStringAsync(path, json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    }
  };

  const exportCsv = async () => {
    const accountId = (await repos.accounts.list())[0]?.id;
    if (!accountId) return;
    const rows = await repos.trades.listForHistory(accountId);
    const csv = exportTradesCsv(rows);
    const path = `${FileSystem.cacheDirectory}ledgerline-trades.csv`;
    await FileSystem.writeAsStringAsync(path, csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    }
  };

  const restore = async () => {
    const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (pick.canceled || !pick.assets[0]) return;
    const text = await FileSystem.readAsStringAsync(pick.assets[0].uri);
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      Alert.alert('Invalid backup', 'Nothing was changed.');
      return;
    }
    Alert.alert('Replace all data?', 'This replaces your journal on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          await restoreBackup(repos, parsed.backup);
        },
      },
    ]);
  };

  const wipe = async () => {
    Alert.alert('Delete all data?', 'Type DELETE in the next dialog.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: async () => {
          await deleteAllJournalData(repos);
          await refreshMode('unset');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Backup" />
      <EmptyState
        title="Your data stays on-device"
        body="Backups are readable JSON. Store them somewhere private."
      />
      <ButtonUi title="Export JSON backup" onPress={exportJson} />
      <ButtonUi title="Export trades CSV" variant="secondary" onPress={exportCsv} />
      <ButtonUi title="Restore from backup" variant="secondary" onPress={restore} />
      <ButtonUi title="Delete all data" variant="secondary" onPress={wipe} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    paddingTop: 48,
    gap: space.md,
  },
});
