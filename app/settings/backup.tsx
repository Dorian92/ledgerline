import { View, StyleSheet } from 'react-native';

import { useRealModeOnly } from '@/features/guards';
import { ScreenHeader, EmptyState } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';
import { Text } from '@/ui/Text';

export default function BackupScreen() {
  const guard = useRealModeOnly();
  return (
    <View style={styles.container}>
      <ScreenHeader title="Backup" />
      {guard.allowed ? (
        <EmptyState title="Local backup" body="Export and restore will ship in a later build." />
      ) : (
        <Text variant="secondary">{guard.reason}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
