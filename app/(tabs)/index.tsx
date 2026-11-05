import { View, StyleSheet } from 'react-native';

import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.header}>
        Dashboard
      </Text>
      <Card>
        <Text variant="secondary">Your dashboard will appear here.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, paddingTop: 48 },
  header: { marginBottom: space.lg },
});
