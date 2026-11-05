import { View, StyleSheet } from 'react-native';

import { ScreenHeader, EmptyState } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';

export default function InsightsTab() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Insights" />
      <EmptyState
        title="Charts coming together"
        body="Win rate by hour and tilt patterns will appear here after more closed trades."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
