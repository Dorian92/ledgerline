import { View, StyleSheet } from 'react-native';

import { ScreenHeader, EmptyState } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';

export default function ProScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Pro" />
      <EmptyState
        title="Pro (preview)"
        body="Billing and entitlements are mocked until Play Console setup is complete."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
});
