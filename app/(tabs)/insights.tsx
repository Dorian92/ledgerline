import { View, StyleSheet } from 'react-native';

import { EmptyState, ScreenHeader } from '@/ui/primitives';
import { Pill } from '@/ui/Pill';
import { color, space } from '@/ui/tokens';

export default function InsightsTab() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Insights"
        right={
          <View style={styles.badges}>
            <Pill label="PRO" variant="pro" />
          </View>
        }
      />
      <EmptyState
        title="Insights need some closed trades."
        body="Calendar, hour-of-day, and tilt patterns appear once you have history."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
  badges: { flexDirection: 'row', gap: space.sm, paddingTop: space.sm },
});
