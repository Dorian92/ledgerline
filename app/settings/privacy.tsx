import { View, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy" />
      <Text variant="secondary">
        Ledgerline stores trades only on this device. CSV parsing runs locally; nothing is uploaded
        by default.
      </Text>
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
