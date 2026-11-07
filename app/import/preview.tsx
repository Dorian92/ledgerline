import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useImportDraft } from '@/state/importDraft';
import { useSession } from '@/state/session';
import { useRepos } from '@/data/DbProvider';
import { useQuery } from '@tanstack/react-query';
import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function ImportPreviewScreen() {
  const router = useRouter();
  const { fileName, plan } = useImportDraft();
  const accountId = useSession((s) => s.activeAccountId);
  const repos = useRepos();
  const { data: account } = useQuery({
    queryKey: ['account', accountId],
    enabled: !!accountId,
    queryFn: () => repos.accounts.get(accountId!),
  });

  if (!plan) {
    return (
      <NavScreen title="Preview">
        <Text variant="secondary">No import plan loaded.</Text>
      </NavScreen>
    );
  }

  if (!accountId) {
    return (
      <NavScreen title="Preview import">
        <Text variant="secondary">Create a journal account before importing trades.</Text>
        <ButtonUi
          title="Start my journal"
          onPress={() => router.push('/(onboarding)/create-account')}
          style={{ marginTop: space.lg }}
        />
      </NavScreen>
    );
  }

  const ledger = plan.importMode === 'public-fill-ledger';
  const m = ledger ? (plan.summary.ledgerFillsToCreate ?? 0) : plan.summary.tradesToCreate;
  const n = plan.summary.importableRows;

  return (
    <NavScreen title="Preview import" scroll contentContainerStyle={styles.container}>
      <Text variant="section">Into {account?.name ?? 'journal'}</Text>
      <Text variant="body">{fileName}</Text>
      <Text variant="secondary">{plan.label}</Text>
      {plan.attribution ? (
        <View style={styles.banner}>
          <Text variant="section">Third-party public data</Text>
          <Text variant="secondary">{plan.attribution.sourceDescription}</Text>
          {plan.attribution.walletAddress ? (
            <Text variant="monoSmall">{plan.attribution.walletAddress}</Text>
          ) : null}
          {ledger ? (
            <Text variant="caption" style={{ textTransform: 'none', marginTop: space.xs }}>
              No synthetic trades: each row is one execution. closedPnl is exchange gross; fees
              separate. R / stops / funding unavailable.
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.chips}>
        {plan.summary.valid ? <Chip text={`${plan.summary.valid} valid`} /> : null}
        {plan.summary.duplicate ? <Chip text={`${plan.summary.duplicate} duplicates`} /> : null}
        {plan.summary.error ? <Chip text={`${plan.summary.error} errors`} /> : null}
      </View>
      {plan.rows.slice(0, 7).map((r) => (
        <Text key={r.index} variant="monoSmall">
          {r.index} · {r.display.symbol} · {r.status}
        </Text>
      ))}
      <Text variant="secondary" style={{ marginTop: space.md }}>
        Parsed on-device. Your file never leaves this phone.
      </Text>
      <ButtonUi
        title={ledger ? `Import ${m} public fills` : `Import ${m} trades`}
        disabled={m === 0}
        onPress={() => router.push('/import/result')}
        style={{ marginTop: space.lg }}
      />
      <Text variant="caption" style={{ textTransform: 'none' }}>
        from {n} rows
      </Text>
    </NavScreen>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="caption" style={{ textTransform: 'none' }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: color.card,
    padding: space.md,
    borderRadius: 12,
    gap: space.xs,
    marginBottom: space.sm,
  },
  container: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: color.card,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 999,
  },
});
