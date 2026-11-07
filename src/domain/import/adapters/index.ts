import { hyperliquidPublicFillsAdapter } from '@/domain/import/hyperliquidPublicFillsAdapter';
import { testClosedAdapter } from '@/domain/import/testAdapter';

/** Production: verified public formats first; test adapter last (dev/CI only). */
export const importAdapters = [hyperliquidPublicFillsAdapter, testClosedAdapter];
