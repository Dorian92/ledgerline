import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useRepos } from '@/data/DbProvider';
import { useImportDraft } from '@/state/importDraft';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function ImportResultScreen() {
  const router = useRouter();
  const { plan, fileName, clear } = useImportDraft();
  const repos = useRepos();
  const accountId = useSession((s) => s.activeAccountId);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const ledger = plan?.importMode === 'public-fill-ledger';

  const onImport = async () => {
    if (!plan || !accountId) return;
    const {
      batchId: id,
      tradesCreated,
      ledgerRowsCreated,
    } = await repos.imports.commit({
      accountId,
      plan,
      fileName,
    });
    setBatchId(id);
    setCount(ledger ? ledgerRowsCreated : tradesCreated);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Import result" />
      {count > 0 ? (
        <>
          <Text variant="title">
            Imported {count} {ledger ? 'public fills' : 'trades'}
          </Text>
          <ButtonUi
            title={ledger ? 'View public fills' : 'View trades'}
            onPress={() => router.replace(ledger ? '/public-fills' : '/(tabs)/trades')}
          />
          <ButtonUi
            title="Undo import"
            variant="secondary"
            onPress={async () => {
              if (batchId) await repos.imports.undo(batchId);
              clear();
              router.replace('/import');
            }}
          />
        </>
      ) : (
        <>
          <Text variant="secondary">Ready to commit this plan.</Text>
          <ButtonUi title="Commit import" onPress={onImport} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    paddingTop: 48,
    gap: space.md,
  },
});
