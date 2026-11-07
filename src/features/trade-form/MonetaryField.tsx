import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MONETARY_MASK, monetaryAccessibilityLabel } from '@/features/privacy/moneyMask';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export function MonetaryField({
  label,
  value,
  onChange,
  hideAmounts,
  onDirty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hideAmounts: boolean;
  onDirty: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const masked = hideAmounts && !revealed;

  const reveal = () => setRevealed(true);

  return (
    <View style={styles.field}>
      <Text variant="caption">{label}</Text>
      {masked ? (
        <View style={styles.maskRow}>
          <TextInput
            editable={false}
            value={MONETARY_MASK}
            style={styles.input}
            accessibilityLabel={monetaryAccessibilityLabel(true, label, value)}
          />
          <Pressable
            onPress={reveal}
            accessibilityRole="button"
            accessibilityLabel={`Reveal ${label} to edit`}
            style={styles.revealBtn}
          >
            <Text variant="secondary" style={styles.revealText}>
              Reveal
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.maskRow}>
          <TextInput
            value={value}
            onChangeText={(v) => {
              onDirty();
              onChange(v);
            }}
            keyboardType="decimal-pad"
            style={[styles.input, { flex: 1 }]}
            accessibilityLabel={monetaryAccessibilityLabel(false, label, value)}
          />
          {hideAmounts ? (
            <Pressable
              onPress={() => setRevealed(false)}
              accessibilityRole="button"
              accessibilityLabel={`Hide ${label}`}
              style={styles.revealBtn}
            >
              <Text variant="secondary" style={styles.revealText}>
                Hide
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs, flex: 1 },
  maskRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 12,
    padding: space.md,
    color: color.text,
    minHeight: 48,
    flex: 1,
  },
  revealBtn: { minHeight: 48, justifyContent: 'center', paddingHorizontal: space.sm },
  revealText: { color: color.violet, textTransform: 'none' },
});
