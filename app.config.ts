import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Ledgerline',
  slug: 'ledgerline',
  scheme: 'ledgerline',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B0E14',
  icon: './assets/icon.png',
  experiments: {
    typedRoutes: true,
  },
  android: {
    package: 'app.ledgerline',
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#7C5CFF',
    },
  },
  plugins: [
    './plugins/withNoBackup',
    'expo-sqlite',
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'Today',
            label: 'Ledgerline Today',
            minWidth: '250dp',
            minHeight: '110dp',
            targetCellWidth: 4,
            targetCellHeight: 2,
            description: 'Today journal summary',
            previewImage: './assets/icon.png',
            updatePeriodMillis: 1800000,
          },
        ],
      },
    ],
  ],
};

export default config;
