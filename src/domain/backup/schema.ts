import { z } from 'zod';

export const backupV1Schema = z.object({
  format: z.literal('ledgerline-backup'),
  formatVersion: z.literal(1),
  exportedAt: z.number(),
  accounts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quote_currency: z.enum(['USD', 'USDT', 'USDC']),
      starting_balance: z.string().nullable(),
    }),
  ),
  trades: z.array(z.record(z.string(), z.unknown())),
});

export type BackupV1 = z.infer<typeof backupV1Schema>;

export function parseBackup(
  text: string,
): { ok: true; backup: BackupV1 } | { ok: false; reason: string } {
  try {
    const json = JSON.parse(text) as unknown;
    const backup = backupV1Schema.parse(json);
    return { ok: true, backup };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export function serializeBackup(data: BackupV1): string {
  return JSON.stringify(data, null, 2);
}
