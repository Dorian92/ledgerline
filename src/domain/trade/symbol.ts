import type { QuoteCurrency } from '../money/types';
import type { Instrument, SymbolInfo } from './types';

const QUOTES: QuoteCurrency[] = ['USDT', 'USDC', 'USD'];

export function parseSymbol(
  raw: string,
  instrument: Instrument,
  accountQuote?: QuoteCurrency,
): SymbolInfo | null {
  const s = raw.trim().toUpperCase();
  if (!s) {
    return null;
  }
  if (s.endsWith('-PERP') || s.endsWith('/PERP')) {
    const base = s.replace(/-PERP$/, '').replace(/\/PERP$/, '');
    if (!base || !accountQuote) {
      return null;
    }
    return {
      display: `${base}-PERP`,
      base,
      quote: accountQuote,
      instrument: 'perp',
    };
  }
  if (s.includes('-SWAP')) {
    const parts = s.split('-');
    if (parts.length >= 3 && parts[1]) {
      const quote = parts[1] as QuoteCurrency;
      if (QUOTES.includes(quote)) {
        return { display: `${parts[0]}-PERP`, base: parts[0]!, quote, instrument: 'perp' };
      }
    }
    return null;
  }
  for (const q of QUOTES) {
    if (s.endsWith(q)) {
      const base = s.slice(0, -q.length).replace(/[-/]$/, '');
      if (base.length >= 1) {
        const display = instrument === 'perp' ? `${base}-PERP` : `${base}/${q}`;
        return { display, base, quote: q, instrument };
      }
    }
    if (s.includes(`-${q}`) || s.includes(`/${q}`)) {
      const base = s.split(/[-/]/)[0];
      if (base) {
        const display = instrument === 'perp' ? `${base}-PERP` : `${base}/${q}`;
        return { display, base, quote: q, instrument };
      }
    }
  }
  if (accountQuote && /^[A-Z0-9]{2,10}$/.test(s)) {
    return {
      display: instrument === 'perp' ? `${s}-PERP` : `${s}/${accountQuote}`,
      base: s,
      quote: accountQuote,
      instrument,
    };
  }
  return null;
}
