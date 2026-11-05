import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function TodayWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0B0E14',
        borderRadius: 16,
        padding: 16,
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget text="Ledgerline" style={{ fontSize: 14, color: '#FFFFFF' }} />
      <TextWidget text="Today" style={{ fontSize: 12, color: '#94A3B8' }} />
      <TextWidget text="Open app for live PnL" style={{ fontSize: 16, color: '#22C55E' }} />
    </FlexWidget>
  );
}
