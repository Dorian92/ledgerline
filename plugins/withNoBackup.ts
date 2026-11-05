import type { ConfigPlugin } from 'expo/config-plugins';
import { AndroidConfig, withAndroidManifest } from 'expo/config-plugins';

/** Ensures android:allowBackup="false" on the application element (defense in depth). */
const withNoBackup: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:allowBackup'] = 'false';
    return cfg;
  });

export default withNoBackup;
