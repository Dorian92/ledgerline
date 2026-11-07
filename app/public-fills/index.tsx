import { FlatList, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { fromCanonical } from '@/domain/money/canonical';
import { formatMoney } from '@/domain/money/format';
import { useSession } from '@/state/session';
import { usePrivacy } from '@/state/privacy';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function PublicFillsScreen() {
  const repos = useRepos();
  const accountId = useSession((s) => s.activeAccountId);
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const { data: account } = useQuery({
    queryKey: ['account', accountId],
    enabled: !!accountId,
    queryFn: () => repos.accounts.get(accountId!),
  });
  const { data: rows } = useQuery({
    queryKey: ['public-fills', accountId],
    enabled: !!accountId,
    queryFn: () => repos.publicFills.listForAccount(accountId!),
  });

  return (
    <NavScreen title="Public fills" scroll={false}>
      <Text variant="secondary" style={{ marginBottom: space.md }}>
        Third-party public executions. Exchange closedPnl is gross per fill; fees are separate. No
        stops, R, funding, or paired round-trip trades.
      </Text>
      {account ? (
        <Text variant="caption" style={{ marginBottom: space.sm }}>
          Account: {account.name} · quote {account.quote_currency}
        </Text>
      ) : null}
      <FlatList
        data={rows ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: space.xl }}
        ListEmptyComponent={<Text variant="secondary">No public fill ledger imported yet.</Text>}
        renderItem={({ item }) => {
          const fee = fromCanonical(item.fee);
          const closed =
            item.closed_pnl && item.closed_pnl !== '0' ? fromCanonical(item.closed_pnl) : null;
          const quote = item.fee_token as 'USDC' | 'USDT' | 'USD';
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  {item.symbol} · {item.direction_label}
                </Text>
                <Text variant="secondary">
                  {format(new Date(item.executed_at), 'yyyy-MM-dd HH:mm:ss')} UTC
                </Text>
                <Text variant="monoSmall">
                  {hideAmounts ? '•••• @ ••••' : `${item.quantity} @ ${item.price} ${quote}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="monoSmall" style={{ color: color.textMuted }}>
                  fee{' '}
                  {formatMoney(fee, quote, {
                    sign: 'negative',
                    hidden: hideAmounts,
                    compact: true,
                  })}
                </Text>
                <Text variant="monoSmall">
                  closedPnl{' '}
                  {closed
                    ? formatMoney(closed, quote, {
                        sign: 'always',
                        hidden: hideAmounts,
                        compact: true,
                      })
                    : '—'}
                </Text>
                <Text variant="caption" style={{ textTransform: 'none' }}>
                  R —
                </Text>
              </View>
            </View>
          );
        }}
      />
    </NavScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    gap: space.sm,
  },
});
