import { Tabs } from 'expo-router';

import { TabBar } from '@/ui/TabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={({ state }) => <TabBar state={state} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="trades" options={{ title: 'Trades' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
