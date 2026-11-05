import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { TodayWidget } from './TodayWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;
  if (widgetInfo.widgetName === 'Today') {
    renderWidget(<TodayWidget />);
  }
}
