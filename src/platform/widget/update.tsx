import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { loadWidgetSnapshot } from '@/platform/widget/loadSnapshot';

import { TodayWidget } from '@/widgets/TodayWidget';

export async function refreshTodayWidget(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    await requestWidgetUpdate({
      widgetName: 'Today',
      renderWidget: async () => {
        const snapshot = await loadWidgetSnapshot();
        return <TodayWidget snapshot={snapshot} />;
      },
    });
  } catch {
    // Widget may not be installed yet.
  }
}
