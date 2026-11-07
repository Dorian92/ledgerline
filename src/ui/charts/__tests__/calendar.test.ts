import { buildCalendarCells, WEEKDAY_LABELS } from '../InsightCharts';

describe('calendar heatmap grid', () => {
  it('uses unique React keys for weekday headings', () => {
    const keys = WEEKDAY_LABELS.map((w) => w.key);
    expect(new Set(keys).size).toBe(7);
  });

  it('lays out exactly seven cells per row', () => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      dayKey: `2026-11-${String(i + 1).padStart(2, '0')}`,
    }));
    const cells = buildCalendarCells(days, 6);
    expect(cells.length % 7).toBe(0);
    for (let i = 0; i < cells.length; i += 7) {
      expect(cells.slice(i, i + 7)).toHaveLength(7);
    }
  });
});
