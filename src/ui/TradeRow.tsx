import { View, StyleSheet, Pressable } from 'react-native';

import { fromCanonical } from '@/domain/money/canonical';
import { formatMoney, formatR } from '@/domain/money/format';
import { Pill } from './Pill';
import { Text } from './Text';
import { color, space } from './tokens';

export function TradeRow({
  symbol,
  direction,
  timeLabel,
  netPnl,
  rMultiple,
  hidden,
  onPress,
  onLongPress,
}: {
  symbol: string;
  direction: 'long' | 'short';
  timeLabel: string;
  netPnl: string;
  rMultiple: string | null;
  hidden?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const net = fromCanonical(netPnl);
  const body = (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <View style={styles.top}>
          <Text variant="body" style={{ fontWeight: '600' }}>
            {symbol}
          </Text>
          <Pill label={direction.toUpperCase()} variant={direction === 'long' ? 'long' : 'short'} />
        </View>
        <Text variant="secondary">{timeLabel}</Text>
      </View>
      <View style={styles.right}>
        <Text
          variant="mono"
          style={{
            color: hidden ? color.textMuted : net.isPositive() ? color.green : color.red,
          }}
        >
          {formatMoney(net, 'USD', { sign: 'always', compact: true, hidden })}
        </Text>
        <Text variant="monoSmall">
          {hidden ? '••••' : rMultiple ? formatR(fromCanonical(rMultiple)) : '—'}
        </Text>
      </View>
    </View>
  );
  if (onPress || onLongPress) {
    return (
      <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button">
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  right: { alignItems: 'flex-end' },
});
