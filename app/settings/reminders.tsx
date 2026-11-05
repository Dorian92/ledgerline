import { useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useRepos } from '@/data/DbProvider';
import { cancelAllReminders, scheduleJournalReminder } from '@/platform/reminders';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function RemindersSettingsScreen() {
  const repos = useRepos();
  const [enabled, setEnabled] = useState(false);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    if (v) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        setEnabled(false);
        return;
      }
      await scheduleJournalReminder(20, 0);
      await repos.prefs.set('reminder_hour', 20);
      await repos.prefs.set('reminder_minute', 0);
    } else {
      await cancelAllReminders();
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reminders" />
      <Text variant="secondary">
        Optional daily nudge to log trades. Notifications stay on-device (Android 13+ permission
        requested when you enable).
      </Text>
      <View style={styles.row}>
        <Text>Daily reminder · 20:00</Text>
        <Switch value={enabled} onValueChange={toggle} accessibilityLabel="Daily reminder" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    paddingTop: 48,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
});
