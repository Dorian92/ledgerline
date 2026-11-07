import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from './Text';
import { color, radius, space } from './tokens';

export function ButtonUi({
  title,
  variant = 'primary',
  disabled,
  ...rest
}: PressableProps & { title: string; variant?: 'primary' | 'secondary' | 'destructive' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary'
          ? styles.primary
          : variant === 'destructive'
            ? styles.destructive
            : styles.secondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      <Text style={[styles.label, variant === 'destructive' && { color: color.red }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primary: { backgroundColor: color.violet },
  secondary: { borderWidth: 1, borderColor: color.border },
  destructive: { borderWidth: 1, borderColor: color.red, backgroundColor: '#2a1215' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { color: color.text, fontWeight: '600' },
});
