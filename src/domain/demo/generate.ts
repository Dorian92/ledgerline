import { dec } from '../money/dec';
import type { TradeInput } from '../trade/types';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDemoTrades(opts: {
  seed: number;
  now: number;
  accountId: string;
}): TradeInput[] {
  const rnd = mulberry32(opts.seed);
  const trades: TradeInput[] = [];
  const symbols = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP'];
  for (let i = 0; i < 80; i++) {
    const sym = symbols[Math.floor(rnd() * symbols.length)]!;
    const long = rnd() > 0.4;
    const entry = dec(String(100 + rnd() * 50));
    const exit = long ? entry.add(dec(String(rnd() * 5))) : entry.sub(dec(String(rnd() * 3)));
    const qty = dec(String((0.05 + rnd() * 0.2).toFixed(3)));
    const closedAt = opts.now - Math.floor(rnd() * 30 * 86400000);
    trades.push({
      accountId: opts.accountId,
      symbol: sym,
      baseAsset: sym.split('-')[0]!,
      quoteAsset: 'USD',
      instrument: 'perp',
      direction: long ? 'long' : 'short',
      openedAt: closedAt - 3600000,
      closedAt,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      stopPrice: long ? entry.sub(dec('1')) : entry.add(dec('1')),
      leverage: dec('2'),
      fees: dec(String((rnd() * 5).toFixed(2))),
      feesComplete: true,
      funding: dec('0'),
      fundingStatus: 'none',
      pnlSource: 'computed',
      emotion: rnd() > 0.7 ? 'fomo' : 'calm',
      tagIds: [],
      notes: '',
    });
  }
  return trades;
}
