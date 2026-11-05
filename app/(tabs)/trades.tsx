import { View, StyleSheet } from 'react-native';

import { EmptyState, ScreenHeader } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';

export default function TradesTab() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Trades" />
      <EmptyState title="No trades yet." body="Add a trade or import a CSV from Settings." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
