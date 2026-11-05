import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { color, space } from './tokens';

const tabs = ['Home', 'Trades', 'Insights', 'Settings'] as const;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = tabs[index] ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => navigation.navigate(route.name)}
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
