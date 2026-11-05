import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { useImportDraft } from '@/state/importDraft';
import { ButtonUi } from '@/ui/Button';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function ImportPreviewScreen() {
  const router = useRouter();
  const { fileName, plan } = useImportDraft();

  if (!plan) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Preview" />
        <Text variant="secondary">No import plan loaded.</Text>
      </View>
    );
  }

  const m = plan.summary.tradesToCreate;
  const n = plan.summary.importableRows;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title="Preview import" />
      <Text variant="body">{fileName}</Text>
      <Text variant="secondary">{plan.label}</Text>
      <View style={styles.chips}>
        {plan.summary.valid ? <Chip text={`${plan.summary.valid} valid`} /> : null}
        {plan.summary.duplicate ? <Chip text={`${plan.summary.duplicate} duplicates`} /> : null}
        {plan.summary.error ? <Chip text={`${plan.summary.error} errors`} /> : null}
      </View>
      {plan.rows.slice(0, 7).map((r) => (
        <Text key={r.index} variant="monoSmall">
          {r.index} · {r.display.symbol} · {r.status}
        </Text>
      ))}
      <Text variant="secondary" style={{ marginTop: space.md }}>
        Parsed on-device. Your file never leaves this phone.
      </Text>
      <ButtonUi
        title={`Import ${m} trades`}
        disabled={m === 0}
        onPress={() => router.push('/import/result')}
        style={{ marginTop: space.lg }}
      />
      <Text variant="caption" style={{ textTransform: 'none' }}>
        from {n} rows
      </Text>
    </ScrollView>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="caption" style={{ textTransform: 'none' }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingTop: 48, gap: space.sm, backgroundColor: color.bg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: color.card,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 999,
  },
});
