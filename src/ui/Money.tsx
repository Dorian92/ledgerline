import type { Dec } from '@/domain/money/dec';
import { formatMoney } from '@/domain/money/format';
import type { QuoteCurrency } from '@/domain/money/types';
import { Text } from './Text';
import { color } from './tokens';
import { typography } from './typography';

export function Money({
  amount,
  currency,
  variant = 'mono',
  hidden,
}: {
  amount: Dec;
  currency: QuoteCurrency;
  variant?: 'hero' | 'mono';
  hidden?: boolean;
}) {
  const formatted = formatMoney(amount, currency, { sign: 'always', hidden });
  const style = variant === 'hero' ? typography.hero : typography.mono;
  const tint = hidden
    ? color.textMuted
    : amount.isPositive() && !amount.isZero()
      ? color.green
      : amount.isNegative()
        ? color.red
        : color.text;
  return (
    <Text
      style={[style, { color: tint }]}
      accessibilityLabel={hidden ? 'Amount hidden' : formatted}
    >
      {formatted}
    </Text>
  );
}
