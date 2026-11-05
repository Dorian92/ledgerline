import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, ScreenHeader } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';
import { Text } from '@/ui/Text';

export default function SettingsTab() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/dev/ui-gallery')}
          style={styles.link}
        >
          <Text style={{ color: color.violet }}>UI gallery (dev)</Text>
        </Pressable>
      ) : null}
      <EmptyState title="Settings" body="Preferences will appear here." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
  link: { minHeight: 48, justifyContent: 'center', marginBottom: space.md },
});
