export function exportTradesCsv(
  rows: {
    symbol: string;
    direction: string;
    opened_at: number;
    closed_at: number | null;
    net_pnl: string | null;
  }[],
): string {
  const header = 'symbol,direction,opened_at,closed_at,net_pnl';
  const lines = rows.map((r) =>
    [
      r.symbol,
      r.direction,
      new Date(r.opened_at).toISOString(),
      r.closed_at ? new Date(r.closed_at).toISOString() : '',
      r.net_pnl ?? '',
    ]
      .map((c) => (String(c).includes(',') ? `"${String(c).replace(/"/g, '""')}"` : String(c)))
      .join(','),
  );
  return [header, ...lines].join('\n');
}
