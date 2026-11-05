import { Text as RNText, type TextProps, StyleSheet } from 'react-native';

import { color } from './tokens';

type Variant = 'title' | 'body' | 'secondary' | 'caption' | 'mono' | 'section';

const styles = StyleSheet.create({
  title: { color: color.text, fontSize: 26, fontWeight: '700' },
  body: { color: color.text, fontSize: 15 },
  secondary: { color: color.textSecondary, fontSize: 13 },
  section: { color: color.text, fontSize: 17, fontWeight: '600' },
  caption: {
    color: color.textMuted,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  mono: { color: color.text, fontSize: 15, fontFamily: 'JetBrainsMono_400Regular' },
});

export function Text({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <RNText style={[styles[variant], style]} {...rest} />;
}
