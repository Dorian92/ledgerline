import { View, StyleSheet, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';

import { useRepos } from '@/data/DbProvider';
import { NavScreen } from '@/ui/NavScreen';
import { usePrivacy } from '@/state/privacy';
import { Text } from '@/ui/Text';
import { space } from '@/ui/tokens';

export default function PrivacyScreen() {
  const repos = useRepos();
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const setHideAmounts = usePrivacy((s) => s.setHideAmounts);
  const [lock, setLock] = useState(false);
  const [blockCapture, setBlockCapture] = useState(false);
  const [canLock, setCanLock] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setCanLock);
    repos.prefs.get('hide_amounts').then((v) => {
      if (typeof v === 'boolean') setHideAmounts(v);
    });
  }, [repos, setHideAmounts]);

  const toggleHide = async (v: boolean) => {
    setHideAmounts(v);
    await repos.prefs.set('hide_amounts', v);
  };

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
    <NavScreen title="Privacy" scroll>
      <Text variant="secondary">
        Ledgerline stores trades only on this device. CSV parsing runs locally; nothing is uploaded
        by default.
      </Text>
      <View style={styles.row}>
        <Text>Hide amounts</Text>
        <Switch value={hideAmounts} onValueChange={toggleHide} accessibilityLabel="Hide amounts" />
      </View>
      <Text variant="caption">
        Masks currency across dashboards, lists, charts, and screen reader labels.
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
    </NavScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    marginTop: space.md,
  },
});
