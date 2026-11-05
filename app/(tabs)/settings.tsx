import { ScrollView, StyleSheet, Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import { useRepos } from '@/data/DbProvider';
import { refreshTodayWidget } from '@/platform/widget/update';
import { usePrivacy, resolveDisplayTz } from '@/state/privacy';
import { useSession } from '@/state/session';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function SettingsTab() {
  const router = useRouter();
  const repos = useRepos();
  const mode = useSession((s) => s.mode);
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const setHideAmounts = usePrivacy((s) => s.setHideAmounts);
  const displayTz = usePrivacy((s) => s.displayTz);
  const setDisplayTz = usePrivacy((s) => s.setDisplayTz);

  const persistHide = async (v: boolean) => {
    setHideAmounts(v);
    await repos.prefs.set('hide_amounts', v);
    void refreshTodayWidget();
  };

  const persistTz = async (v: 'device' | 'UTC') => {
    setDisplayTz(v);
    await repos.prefs.set('display_tz', v);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" />
      <Section title="Account">
        {mode === 'demo' ? (
          <Text variant="secondary">Demo account (read-only)</Text>
        ) : (
          <Row label="Manage accounts" onPress={() => router.push('/settings/accounts')} />
        )}
        <Text variant="caption">Display TZ: {resolveDisplayTz(displayTz)}</Text>
        <Row
          label="Use UTC for dates"
          onPress={() => persistTz(displayTz === 'UTC' ? 'device' : 'UTC')}
        />
      </Section>
      <Section title="Privacy">
        <View style={styles.row}>
          <Text>Hide amounts</Text>
          <Switch
            value={hideAmounts}
            onValueChange={persistHide}
            accessibilityLabel="Hide amounts"
          />
        </View>
        <Row label="Privacy & app lock" onPress={() => router.push('/settings/privacy')} />
      </Section>
      <Section title="Data">
        <Row label="Import CSV" onPress={() => router.push('/import')} />
        <Row label="Backup & restore" onPress={() => router.push('/settings/backup')} />
      </Section>
      <Section title="Pro">
        <Row label="Ledgerline Pro" onPress={() => router.push('/settings/pro')} />
      </Section>
      <Section title="Reminders">
        <Row label="Daily reminder" onPress={() => router.push('/settings/reminders')} />
      </Section>
      {__DEV__ ? <Row label="UI gallery" onPress={() => router.push('/dev/ui-gallery')} /> : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption">{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <Text>{label}</Text>
      <Text variant="secondary">›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, paddingTop: 48, paddingBottom: 120, gap: space.md },
  section: { gap: space.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
});
