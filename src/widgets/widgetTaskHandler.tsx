import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { loadWidgetSnapshot } from '@/platform/widget/loadSnapshot';

import { TodayWidget } from './TodayWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;
  if (widgetInfo.widgetName !== 'Today') {
    return;
  }
  try {
    const snapshot = await loadWidgetSnapshot();
    renderWidget(<TodayWidget snapshot={snapshot} />);
  } catch {
    renderWidget(
      <TodayWidget
        snapshot={{
          dateLabel: '',
          netPnlText: 'Open Ledgerline to refresh',
          netPnlColor: 'muted',
          statsLine: '',
          showDemoTag: false,
          proLocked: false,
          hideAmounts: false,
          unsetMode: false,
        }}
      />,
    );
  }
}
