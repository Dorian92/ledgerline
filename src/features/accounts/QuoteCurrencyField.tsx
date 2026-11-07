import { View, StyleSheet } from 'react-native';

import type { QuoteCurrency } from '@/domain/money/types';
import { Segmented } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { space } from '@/ui/tokens';

export const ACCOUNT_QUOTE_OPTIONS: { value: QuoteCurrency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

export function QuoteCurrencyField({
  value,
  onChange,
  disabled,
}: {
  value: QuoteCurrency;
  onChange: (v: QuoteCurrency) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <Text variant="caption">Quote currency (units)</Text>
      <Text variant="secondary" style={styles.help}>
        Every amount in this account is stored and shown in this unit. The app does not convert
        between USD, USDC, and USDT. Hyperliquid public fill imports require USDC to match file
        fees.
      </Text>
      <Segmented
        options={ACCOUNT_QUOTE_OPTIONS}
        value={value}
        onChange={disabled ? () => {} : onChange}
      />
      <Text variant="caption" style={styles.baseline}>
        Opening wallet balance is unknown unless you set it later — imports and fill ledgers do not
        set account equity.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg, gap: space.sm },
  help: { textTransform: 'none', lineHeight: 20 },
  baseline: { textTransform: 'none', marginTop: space.xs },
});
