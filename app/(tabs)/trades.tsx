import { View, StyleSheet } from 'react-native';

import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function TradesTab() {
  return (
    <View style={styles.container}>
      <Text variant="title">Trades</Text>
      <Text variant="secondary" style={{ marginTop: space.md }}>
        No trades yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
