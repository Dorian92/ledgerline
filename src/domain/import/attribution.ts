import type { ImportAttribution, ImportPlan } from './types';

export function formatImportAttributionNote(attribution: ImportAttribution): string {
  const parts = ['Third-party public data — not your wallet.', attribution.sourceDescription];
  if (attribution.walletAddress) {
    parts.push(`Public wallet: ${attribution.walletAddress}`);
  }
  return parts.join(' ');
}

export function tradeNotesWithAttribution(existingNotes: string, plan: ImportPlan): string {
  if (!plan.attribution) {
    return existingNotes;
  }
  const prefix = formatImportAttributionNote(plan.attribution);
  if (!existingNotes.trim()) {
    return prefix;
  }
  return `${prefix}\n\n${existingNotes.trim()}`;
}
