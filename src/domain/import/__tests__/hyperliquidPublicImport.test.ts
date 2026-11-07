import * as fs from 'fs';
import * as path from 'path';

import { hyperliquidPublicFillsAdapter } from '../hyperliquidPublicFillsAdapter';
import { buildImportPlan } from '../plan';

const FIXTURE = path.join(
  process.cwd(),
  'fixtures/csv/real-anonymized/hyperliquid/public.hyperliquid.fills.v1__stuxfred-candidate.csv',
);

describe('hyperliquid public fill ledger', () => {
  const text = fs.readFileSync(FIXTURE, 'utf8');

  it('detects verified CSV and builds 60 fill ledger rows', async () => {
    const plan = await buildImportPlan({
      text,
      adapters: [hyperliquidPublicFillsAdapter],
      quoteCurrency: 'USDC',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    expect('summary' in plan).toBe(true);
    if (!('summary' in plan)) return;
    expect(plan.importMode).toBe('public-fill-ledger');
    expect(plan.formatId).toBe('public.hyperliquid.fills.v1');
    expect(plan.summary.tradesToCreate).toBe(0);
    expect(plan.summary.ledgerFillsToCreate).toBe(60);
    expect(plan.publicFillLedger?.length).toBe(60);
    expect(plan.attribution?.walletAddress).toMatch(/^0x/);
    const withPnl = plan.publicFillLedger!.filter((r) => r.closedPnl && r.closedPnl !== '0').length;
    expect(withPnl).toBe(31);
    expect(plan.trades.length).toBe(0);
  });

  it('rejects USD account when fees are USDC', async () => {
    const plan = await buildImportPlan({
      text,
      adapters: [hyperliquidPublicFillsAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    if (!('summary' in plan)) throw new Error('expected plan');
    expect(plan.summary.error).toBe(60);
    expect(plan.summary.ledgerFillsToCreate).toBe(0);
  });
});
