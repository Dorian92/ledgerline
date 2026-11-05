import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { useRealModeOnly } from '@/features/guards';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, radius, space } from '@/ui/tokens';

const EXCHANGES = [
  { id: 'binance', label: 'Binance', monogram: 'B' },
  { id: 'bybit', label: 'Bybit', monogram: 'BY' },
  { id: 'okx', label: 'OKX', monogram: 'OK' },
] as const;

export default function ImportIndexScreen() {
  const router = useRouter();
  const guard = useRealModeOnly();

  if (!guard.allowed) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Import trades" />
        <Text variant="secondary">{guard.reason}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Import trades" />
      <Text variant="secondary">
        Choose an exchange. Verified CSV imports are not available yet.
      </Text>
      <View style={styles.tiles}>
        {EXCHANGES.map((ex) => (
          <Pressable key={ex.id} style={styles.tile} accessibilityRole="button" onPress={() => {}}>
            <Text variant="title">{ex.monogram}</Text>
            <Text variant="body">{ex.label}</Text>
            <Text variant="caption" style={styles.notYet}>
              Not yet
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={{ color: color.violet }}>Back</Text>
      </Pressable>
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
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '30%',
    minWidth: 100,
    backgroundColor: color.card,
    borderRadius: radius.card,
    padding: space.md,
    alignItems: 'center',
    gap: space.xs,
    opacity: 0.85,
  },
  notYet: { color: color.textMuted, textTransform: 'none' },
});
