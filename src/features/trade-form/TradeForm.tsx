import { useMemo, useState } from 'react';

import { usePrivacy } from '@/state/privacy';
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

import type { MonetaryFieldKey } from '@/features/privacy/moneyMask';

import { MonetaryField } from './MonetaryField';
import { SetupTagsField } from './SetupTagsField';
import type { TradeFormValues } from './schema';

const QUICK_ADD_DEFAULTS: TradeFormValues = {
  symbol: 'BTC-PERP',
  direction: 'long',
  entry: '68412.5',
  exit: '69240',
  quantity: '0.15',
  stop: '68020',
  fees: '4.10',
  emotion: 'calm',
  tagIds: [],
  notes: '',
};

export function TradeForm({
  onSubmit,
  submitting,
  onCancel,
  initialValues,
  formKey,
}: {
  onSubmit: (
    values: TradeFormValues,
    opts?: { dirtyFields: Partial<Record<MonetaryFieldKey, boolean>> },
  ) => void;
  submitting?: boolean;
  onCancel?: () => void;
  /** When set, form must not show quick-add defaults (edit mode). */
  initialValues?: TradeFormValues;
  formKey?: string;
}) {
  const accountId = useSession((s) => s.activeAccountId);
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const seed = initialValues ?? QUICK_ADD_DEFAULTS;
  const [symbol, setSymbol] = useState(seed.symbol);
  const [direction, setDirection] = useState<'long' | 'short'>(seed.direction);
  const [entry, setEntry] = useState(seed.entry);
  const [exit, setExit] = useState(seed.exit ?? '');
  const [quantity, setQuantity] = useState(seed.quantity);
  const [stop, setStop] = useState(seed.stop ?? '');
  const [fees, setFees] = useState(seed.fees ?? '');
  const [emotion, setEmotion] = useState<'calm' | 'fomo' | 'revenge' | 'fear'>(
    seed.emotion ?? 'calm',
  );
  const [tagIds, setTagIds] = useState<string[]>(seed.tagIds ?? []);
  const [notes, setNotes] = useState(seed.notes ?? '');
  const [dirtyFields, setDirtyFields] = useState<Partial<Record<MonetaryFieldKey, boolean>>>({});

  const markDirty = (field: MonetaryFieldKey) => {
    setDirtyFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

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
    onSubmit(
      { symbol, direction, entry, exit, quantity, stop, fees, notes, emotion, tagIds },
      { dirtyFields },
    );
  };

  return (
    <KeyboardAvoidingView
      key={formKey}
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
        {hideAmounts ? (
          <Text variant="caption" style={{ textTransform: 'none' }}>
            Price, size, and fee fields are hidden until you tap Reveal on each one.
          </Text>
        ) : null}
        <View style={styles.twoCol}>
          <MonetaryField
            label="ENTRY"
            value={entry}
            onChange={setEntry}
            hideAmounts={hideAmounts}
            onDirty={() => markDirty('entry')}
          />
          <MonetaryField
            label="EXIT"
            value={exit}
            onChange={setExit}
            hideAmounts={hideAmounts}
            onDirty={() => markDirty('exit')}
          />
        </View>
        <View style={styles.twoCol}>
          <MonetaryField
            label="SIZE"
            value={quantity}
            onChange={setQuantity}
            hideAmounts={hideAmounts}
            onDirty={() => markDirty('quantity')}
          />
          <MonetaryField
            label="STOP"
            value={stop}
            onChange={setStop}
            hideAmounts={hideAmounts}
            onDirty={() => markDirty('stop')}
          />
        </View>
        <MonetaryField
          label="FEES"
          value={fees}
          onChange={setFees}
          hideAmounts={hideAmounts}
          onDirty={() => markDirty('fees')}
        />
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
            <Money amount={derived.netPnl} currency="USD" variant="hero" hidden={hideAmounts} />
            <Text variant="mono">{derived.rMultiple ? formatR(derived.rMultiple) : 'R —'}</Text>
          </Card>
        ) : null}
        <ButtonUi title="Save trade" onPress={save} disabled={submitting || !accountId} />
        {onCancel ? (
          <ButtonUi
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={{ marginTop: space.sm }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: space.md, paddingBottom: 48 },
  twoCol: { flexDirection: 'row', gap: space.sm },
  field: { gap: space.xs, flex: 1 },
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
    paddingVertical: space.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  chipActive: { borderColor: color.violet, backgroundColor: color.violetSoft },
});
