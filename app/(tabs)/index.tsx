import { View, StyleSheet } from 'react-native';

import { EmptyState, ScreenHeader } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="Ledgerline" title="Dashboard" />
      <EmptyState
        title="Your dashboard will appear here."
        body="Closed trades and metrics show up after you add or import trades."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
