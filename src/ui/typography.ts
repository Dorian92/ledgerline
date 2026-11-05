import { StyleSheet } from 'react-native';

import { color } from './tokens';

export const typography = StyleSheet.create({
  hero: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono_600SemiBold',
    color: color.text,
  },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'Inter_700Bold', color: color.text },
  section: { fontSize: 17, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: color.text },
  body: { fontSize: 15, fontFamily: 'Inter_400Regular', color: color.text },
  secondary: { fontSize: 13, fontFamily: 'Inter_400Regular', color: color.textSecondary },
  caption: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: color.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  mono: { fontSize: 15, fontFamily: 'JetBrainsMono_400Regular', color: color.text },
  monoSmall: { fontSize: 13, fontFamily: 'JetBrainsMono_400Regular', color: color.textSecondary },
});
