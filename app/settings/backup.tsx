import { View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { useRepos } from '@/data/DbProvider';
import { exportBackupJson } from '@/data/backup/export';
import { useRealModeOnly } from '@/features/guards';
import { ScreenHeader, EmptyState } from '@/ui/primitives';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function BackupScreen() {
  const guard = useRealModeOnly();
  const repos = useRepos();
  return (
    <View style={styles.container}>
      <ScreenHeader title="Backup" />
      {guard.allowed ? (
        <>
          <EmptyState
            title="Local backup"
            body="Export a JSON snapshot of accounts. Restore from file is validated before apply."
          />
          <ButtonUi
            title="Export JSON backup"
            onPress={async () => {
              const json = await exportBackupJson(repos);
              const path = `${FileSystem.cacheDirectory}ledgerline-backup.json`;
              await FileSystem.writeAsStringAsync(path, json);
            }}
          />
          <Text variant="secondary">File saved to app cache (share sheet in a later build).</Text>
        </>
      ) : (
        <Text variant="secondary">{guard.reason}</Text>
      )}
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
