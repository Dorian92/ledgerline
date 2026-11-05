import { View, StyleSheet } from 'react-native';

import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function InsightsTab() {
  return (
    <View style={styles.container}>
      <Text variant="title">Insights</Text>
      <Text variant="secondary" style={{ marginTop: space.md }}>
        Insights need some closed trades.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
