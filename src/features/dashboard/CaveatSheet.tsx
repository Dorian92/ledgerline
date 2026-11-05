import { Modal, Pressable, StyleSheet } from 'react-native';

import type { Summary } from '@/domain/metrics/summary';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, radius, space } from '@/ui/tokens';

export function CaveatSheet({
  visible,
  onClose,
  summary,
}: {
  visible: boolean;
  onClose: () => void;
  summary: Summary;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="title">About these numbers</Text>
          <Text variant="secondary">
            Win rate excludes breakeven trades. Average R includes only closed trades with a valid
            stop. Max drawdown uses end-of-trade equity in the selected period.
          </Text>
          {summary.caveats.feesIncomplete > 0 ? (
            <Text variant="secondary">
              Fees incomplete for {summary.caveats.feesIncomplete} trade(s) — non-quote fees are not
              converted.
            </Text>
          ) : null}
          {summary.caveats.fundingUnknown > 0 ? (
            <Text variant="secondary">
              Funding not included for {summary.caveats.fundingUnknown} trade(s).
            </Text>
          ) : null}
          <ButtonUi title="Got it" onPress={onClose} />
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
