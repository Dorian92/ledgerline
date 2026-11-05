import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function SettingsTab() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" />
      <SettingsRow label="Import CSV" onPress={() => router.push('/import')} />
      <SettingsRow label="Backup & restore" onPress={() => router.push('/settings/backup')} />
      <SettingsRow label="Privacy" onPress={() => router.push('/settings/privacy')} />
      <SettingsRow label="Ledgerline Pro" onPress={() => router.push('/settings/pro')} />
      {__DEV__ ? (
        <SettingsRow label="UI gallery (dev)" onPress={() => router.push('/dev/ui-gallery')} />
      ) : null}
    </ScrollView>
  );
}

function SettingsRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <Text>{label}</Text>
      <Text variant="secondary">›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, paddingTop: 48, gap: space.sm, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
});
