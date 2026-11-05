import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, Fab, Segmented, StatTile, Banner, Chip, ScreenHeader } from '@/ui/primitives';
import { Card } from '@/ui/Card';
import { ButtonUi } from '@/ui/Button';
import { Pill } from '@/ui/Pill';
import { color, space } from '@/ui/tokens';

export default function UiGallery() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <ScreenHeader title="UI gallery" />
      <Card>
        <Segmented
          options={[
            { value: '7D', label: '7D' },
            { value: '30D', label: '30D' },
          ]}
          value="30D"
          onChange={() => {}}
        />
      </Card>
      <View style={styles.row}>
        <Pill label="LONG" variant="long" />
        <Pill label="SHORT" variant="short" />
        <Pill label="DEMO DATA" variant="demo" />
      </View>
      <StatTile label="WIN RATE" value="58.4%" />
      <Banner title="Tilt warning" body="Example banner" />
      <Chip label="Calm" selected onPress={() => {}} />
      <ButtonUi title="Primary" onPress={() => {}} />
      <EmptyState title="Empty" body="Example" />
      <Fab onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  pad: { padding: space.lg, gap: space.lg, paddingBottom: 120 },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
