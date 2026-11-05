import { Modal, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

import type { HistoryFilter } from '@/domain/metrics/history';
import { ButtonUi } from '@/ui/Button';
import { Segmented } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, radius, space } from '@/ui/tokens';

export function FilterSheet({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: HistoryFilter;
  onClose: () => void;
  onApply: (f: HistoryFilter) => void;
}) {
  const [direction, setDirection] = useState<'long' | 'short' | undefined>(initial.direction);
  const [outcome, setOutcome] = useState<'win' | 'loss' | 'breakeven' | undefined>(initial.outcome);
  const [source, setSource] = useState<'manual' | 'import' | undefined>(
    initial.source === 'demo' ? undefined : initial.source,
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="title">Filters</Text>
          <Text variant="caption">DIRECTION</Text>
          <Segmented
            options={[
              { value: 'long', label: 'Long' },
              { value: 'short', label: 'Short' },
            ]}
            value={direction ?? 'long'}
            onChange={(v) => setDirection(v)}
          />
          <Text variant="caption">OUTCOME</Text>
          <Segmented
            options={[
              { value: 'win', label: 'Win' },
              { value: 'loss', label: 'Loss' },
              { value: 'breakeven', label: 'BE' },
            ]}
            value={outcome ?? 'win'}
            onChange={(v) => setOutcome(v)}
          />
          <Text variant="caption">SOURCE</Text>
          <Segmented
            options={[
              { value: 'manual', label: 'Manual' },
              { value: 'import', label: 'Import' },
            ]}
            value={source ?? 'manual'}
            onChange={(v) => setSource(v)}
          />
          <ButtonUi
            title="Apply"
            onPress={() =>
              onApply({
                direction,
                outcome,
                source,
              })
            }
          />
          <ButtonUi
            title="Reset"
            variant="secondary"
            onPress={() => {
              onApply({});
              onClose();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
});
