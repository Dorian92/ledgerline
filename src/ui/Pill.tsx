import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { color, radius } from './tokens';

type PillVariant = 'long' | 'short' | 'demo' | 'pro' | 'neutral';

export function Pill({ label, variant = 'neutral' }: { label: string; variant?: PillVariant }) {
  const bg =
    variant === 'long'
      ? color.greenSoft
      : variant === 'short'
        ? color.redSoft
        : variant === 'demo'
          ? 'transparent'
          : variant === 'pro'
            ? color.violet
            : color.card;
  const textColor =
    variant === 'long'
      ? color.green
      : variant === 'short'
        ? color.red
        : variant === 'demo'
          ? color.violet
          : variant === 'pro'
            ? color.text
            : color.textSecondary;
  return (
    <View style={[styles.pill, { backgroundColor: bg }, variant === 'demo' && styles.demoBorder]}>
      <Text variant="caption" style={{ color: textColor, textTransform: 'none' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  demoBorder: { borderWidth: 1, borderColor: color.violet },
});
