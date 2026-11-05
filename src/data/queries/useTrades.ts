import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { qk } from '@/data/queries/keys';
import { dec } from '@/domain/money/dec';
import { parseUserDecimal } from '@/domain/money/parse';
import type { TradeInput } from '@/domain/trade/types';
import { useSession } from '@/state/session';

function formToInput(values: {
  symbol: string;
  direction: 'long' | 'short';
  entry: string;
  exit?: string;
  quantity: string;
  stop?: string;
  fees?: string;
  notes?: string;
  emotion?: 'calm' | 'fomo' | 'revenge' | 'fear';
  tagIds?: string[];
  accountId: string;
  quoteAsset: 'USD' | 'USDT' | 'USDC';
}): TradeInput | { error: string } {
  const entry = parseUserDecimal(values.entry);
  const qty = parseUserDecimal(values.quantity);
  if (!entry.ok) return { error: 'Invalid entry' };
  if (!qty.ok) return { error: 'Invalid size' };
  const exitParsed = values.exit?.trim() ? parseUserDecimal(values.exit) : null;
  if (values.exit?.trim() && exitParsed && !exitParsed.ok) return { error: 'Invalid exit' };
  const stopParsed = values.stop?.trim() ? parseUserDecimal(values.stop) : null;
  if (values.stop?.trim() && stopParsed && !stopParsed.ok) return { error: 'Invalid stop' };
  const feesParsed = values.fees?.trim()
    ? parseUserDecimal(values.fees)
    : { ok: true as const, value: dec('0') };
  if (!feesParsed.ok) return { error: 'Invalid fees' };
  const sym = values.symbol.toUpperCase().replace(/\s/g, '');
  const base = sym.split('-')[0] ?? sym;
  const now = Date.now();
  const closedAt = exitParsed?.ok ? now : null;
  return {
    accountId: values.accountId,
    symbol: sym.includes('-') ? sym : `${base}-PERP`,
    baseAsset: base,
    quoteAsset: values.quoteAsset,
    instrument: 'perp',
    direction: values.direction,
    openedAt: now - 3600000,
    closedAt: closedAt,
    entryPrice: entry.value,
    exitPrice: exitParsed?.ok ? exitParsed.value : null,
    quantity: qty.value,
    stopPrice: stopParsed?.ok ? stopParsed.value : null,
    leverage: dec('1'),
    fees: feesParsed.value,
    feesComplete: true,
    funding: dec('0'),
    fundingStatus: 'none',
    pnlSource: 'computed',
    emotion: values.emotion ?? 'calm',
    tagIds: values.tagIds ?? [],
    notes: values.notes?.trim() ?? '',
  };
}

export { formToInput };

export function useTradesList() {
  const repos = useRepos();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  return useQuery({
    queryKey: qk.trades(mode, accountId),
    enabled: !!accountId,
    queryFn: () => repos.trades.listForAccount(accountId!),
  });
}

export function useCreateTrade() {
  const repos = useRepos();
  const qc = useQueryClient();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  return useMutation({
    mutationFn: (input: TradeInput) => repos.trades.create(input, 'manual'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.root(mode, accountId) });
    },
  });
}

export function useUpdateTrade() {
  const repos = useRepos();
  const qc = useQueryClient();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TradeInput }) =>
      repos.trades.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.root(mode, accountId) });
    },
  });
}

export function useTags() {
  const repos = useRepos();
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => repos.tags.list(),
  });
}

export function useCreateTag() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => repos.tags.create(name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTrade() {
  const repos = useRepos();
  const qc = useQueryClient();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  return useMutation({
    mutationFn: (id: string) => repos.trades.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.root(mode, accountId) });
    },
  });
}
