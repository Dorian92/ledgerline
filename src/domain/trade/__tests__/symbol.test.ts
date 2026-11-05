import { parseSymbol } from '../symbol';

describe('parseSymbol', () => {
  it('parses BTCUSDT perp', () => {
    expect(parseSymbol('BTCUSDT', 'perp', 'USDT')?.display).toBe('BTC-PERP');
  });
  it('parses manual BTC-PERP', () => {
    expect(parseSymbol('BTC-PERP', 'perp', 'USDT')?.base).toBe('BTC');
  });
});
