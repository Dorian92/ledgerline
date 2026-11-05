import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Pressable,
} from 'react-native';

import { formToInput } from '@/data/queries/useTrades';
import { computeTrade } from '@/domain/trade/compute';
import { formatR } from '@/domain/money/format';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Money } from '@/ui/Money';
import { Text } from '@/ui/Text';
import { Segmented } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';

import { SetupTagsField } from './SetupTagsField';
import type { TradeFormValues } from './schema';

export function TradeForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: TradeFormValues) => void;
  submitting?: boolean;
}) {
  const accountId = useSession((s) => s.activeAccountId);
  const [symbol, setSymbol] = useState('BTC-PERP');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('68412.5');
  const [exit, setExit] = useState('69240');
  const [quantity, setQuantity] = useState('0.15');
  const [stop, setStop] = useState('68020');
  const [fees, setFees] = useState('4.10');
  const [emotion, setEmotion] = useState<'calm' | 'fomo' | 'revenge' | 'fear'>('calm');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const emotions: { id: typeof emotion; label: string }[] = [
    { id: 'calm', label: 'Calm' },
    { id: 'fomo', label: 'FOMO' },
    { id: 'revenge', label: 'Revenge' },
    { id: 'fear', label: 'Fear' },
  ];

  const derived = useMemo(() => {
    if (!accountId) return null;
    const input = formToInput({
      symbol,
      direction,
      entry,
      exit,
      quantity,
      stop,
      fees,
      emotion,
      tagIds,
      accountId,
      quoteAsset: 'USD',
    });
    if ('error' in input) return null;
    return computeTrade(input);
  }, [accountId, symbol, direction, entry, exit, quantity, stop, fees, emotion, tagIds]);

  const save = () => {
    onSubmit({ symbol, direction, entry, exit, quantity, stop, fees, notes, emotion, tagIds });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text variant="caption">SYMBOL</Text>
        <TextInput value={symbol} onChangeText={setSymbol} style={styles.input} />
        <Segmented
          options={[
            { value: 'long', label: 'Long' },
            { value: 'short', label: 'Short' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        <Field label="ENTRY" value={entry} onChange={setEntry} />
        <Field label="EXIT" value={exit} onChange={setExit} />
        <Field label="SIZE" value={quantity} onChange={setQuantity} />
        <Field label="STOP" value={stop} onChange={setStop} />
        <Field label="FEES" value={fees} onChange={setFees} />
        <Text variant="caption">EMOTION</Text>
        <View style={styles.emotions}>
          {emotions.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setEmotion(e.id)}
              style={[styles.chip, emotion === e.id && styles.chipActive]}
            >
              <Text variant="caption" style={{ textTransform: 'none' }}>
                {e.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <SetupTagsField selected={tagIds} onChange={setTagIds} />
        <Text variant="caption">NOTE</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, { minHeight: 80 }]}
          maxLength={4000}
        />
        {derived?.netPnl ? (
          <Card style={styles.computed}>
            <Text variant="caption">COMPUTED · LIVE</Text>
            <Money amount={derived.netPnl} currency="USD" variant="hero" />
            <Text variant="mono">{derived.rMultiple ? formatR(derived.rMultiple) : 'R —'}</Text>
          </Card>
        ) : null}
        <ButtonUi title="Save trade" onPress={save} disabled={submitting || !accountId} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text variant="caption">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  field: { gap: space.xs },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 12,
    padding: space.md,
    color: color.text,
    minHeight: 48,
  },
  computed: { marginTop: space.md, gap: space.sm, backgroundColor: color.violetSoft },
  emotions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  chipActive: { borderColor: color.violet, backgroundColor: color.violetSoft },
});
