import { View, StyleSheet, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';

import { useRepos } from '@/data/DbProvider';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function PrivacyScreen() {
  const repos = useRepos();
  const [lock, setLock] = useState(false);
  const [blockCapture, setBlockCapture] = useState(false);
  const [canLock, setCanLock] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setCanLock);
  }, []);

  const toggleLock = async (v: boolean) => {
    if (v) {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Ledgerline',
      });
      if (!r.success) return;
    }
    setLock(v);
    await repos.prefs.set('app_lock_enabled', v);
  };

  const toggleCapture = async (v: boolean) => {
    setBlockCapture(v);
    if (v) await ScreenCapture.preventScreenCaptureAsync();
    else await ScreenCapture.allowScreenCaptureAsync();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy" />
      <Text variant="secondary">
        Ledgerline stores trades only on this device. CSV parsing runs locally; nothing is uploaded
        by default.
      </Text>
      <View style={styles.row}>
        <Text>App lock {canLock ? '' : '(unavailable)'}</Text>
        <Switch
          value={lock}
          onValueChange={toggleLock}
          disabled={!canLock}
          accessibilityLabel="App lock"
        />
      </View>
      <View style={styles.row}>
        <Text>Block screenshots</Text>
        <Switch
          value={blockCapture}
          onValueChange={toggleCapture}
          accessibilityLabel="Block screenshots"
        />
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
