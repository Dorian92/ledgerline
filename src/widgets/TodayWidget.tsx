import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetSnapshot } from '@/domain/metrics/today';

export function TodayWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  const netColor =
    snapshot.netPnlColor === 'green'
      ? '#22C55E'
      : snapshot.netPnlColor === 'red'
        ? '#EF4444'
        : '#94A3B8';
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#131824',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget text="Ledgerline · Today" style={{ fontSize: 12, color: '#94A3B8' }} />
        {snapshot.showDemoTag ? (
          <TextWidget text=" DEMO" style={{ fontSize: 12, color: '#A78BFA' }} />
        ) : null}
      </FlexWidget>
      <TextWidget text={snapshot.dateLabel} style={{ fontSize: 11, color: '#94A3B8' }} />
      <TextWidget
        text={snapshot.netPnlText}
        style={{ fontSize: 22, color: netColor, fontWeight: '600' }}
      />
      <TextWidget text={snapshot.statsLine} style={{ fontSize: 12, color: '#FFFFFF' }} />
    </FlexWidget>
  );
}
