import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { color, space } from './tokens';

const labels = ['Home', 'Trades', 'Insights', 'Settings'] as const;
const hrefs = ['/(tabs)', '/(tabs)/trades', '/(tabs)/insights', '/(tabs)/settings'] as const;

export function TabBar({ state }: Pick<BottomTabBarProps, 'state'>) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const focused = state.index === index;
        const label = labels[index] ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => router.push(hrefs[index] ?? '/(tabs)')}
            style={styles.tab}
          >
            {focused ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
            <Text variant="secondary" style={focused ? styles.active : undefined}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.bg,
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingBottom: space.sm,
    paddingTop: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.violet,
    marginBottom: 4,
  },
  dotPlaceholder: { width: 4, height: 4, marginBottom: 4 },
  active: { color: color.violet, fontWeight: '600' },
});
