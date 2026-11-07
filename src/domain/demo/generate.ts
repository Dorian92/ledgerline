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

/** Demo journal: mixed wins/losses, realistic linear perp PnL (recomputed on write). */
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
    const long = rnd() > 0.45;
    const win = rnd() > 0.42;
    const entry = dec(String(80 + rnd() * 120));
    const move = dec(String(1 + rnd() * 6));
    const lossMove = dec(String(0.5 + rnd() * 2.5));
    let exit = entry;
    if (long) {
      exit = win ? entry.add(move) : entry.sub(lossMove);
    } else {
      exit = win ? entry.sub(move) : entry.add(lossMove);
    }
    const qty = dec(String((0.05 + rnd() * 0.25).toFixed(3)));
    const closedAt = opts.now - Math.floor(rnd() * 30 * 86400000);
    const stopOffset = long ? dec('2') : dec('2');
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
      stopPrice: long ? entry.sub(stopOffset) : entry.add(stopOffset),
      leverage: dec('2'),
      fees: dec(String((0.5 + rnd() * 3).toFixed(2))),
      feesComplete: true,
      funding: dec('0'),
      fundingStatus: 'none',
      pnlSource: 'computed',
      emotion: rnd() > 0.65 ? 'fomo' : 'calm',
      tagIds: [],
      notes: rnd() > 0.8 ? 'Breakout retest' : '',
    });
  }
  return trades;
}
