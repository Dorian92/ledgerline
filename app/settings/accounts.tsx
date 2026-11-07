import { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { ProGate, useHasPro, usePro } from '@/state/pro';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

function AccountRow({
  id,
  name,
  quote,
  onRenamed,
  onDeleted,
  canDelete,
}: {
  id: string;
  name: string;
  quote: string;
  onRenamed: () => void;
  onDeleted: () => void;
  canDelete: boolean;
}) {
  const repos = useRepos();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }
    await repos.accounts.rename(id, trimmed.slice(0, 40));
    setEditing(false);
    onRenamed();
  };

  const remove = () => {
    Alert.alert('Delete account?', 'Trades for this account will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await repos.accounts.delete(id);
          onDeleted();
        },
      },
    ]);
  };

  return (
    <View style={styles.accountRow}>
      {editing ? (
        <TextInput value={draft} onChangeText={setDraft} style={styles.input} />
      ) : (
        <Text variant="body" accessibilityRole="text">
          {name} · {quote}
        </Text>
      )}
      <View style={styles.actions}>
        <ButtonUi
          title={editing ? 'Save' : 'Rename'}
          onPress={() => (editing ? save() : setEditing(true))}
          variant="secondary"
        />
        {canDelete ? (
          <ButtonUi
            title="Delete"
            onPress={remove}
            variant="secondary"
            style={{ borderColor: color.red }}
          />
        ) : null}
      </View>
    </View>
  );
}

export default function AccountsSettingsScreen() {
  const repos = useRepos();
  const router = useRouter();
  const setActive = useSession((s) => s.setActiveAccountId);
  const activeId = useSession((s) => s.activeAccountId);
  const hasPro = useHasPro();
  const mockPurchase = usePro((s) => s.mockPurchase);
  const [name, setName] = useState('Journal 2');
  const { data, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => repos.accounts.list(),
  });

  const createSecond = async () => {
    if (!hasPro && (data?.length ?? 0) >= 1) {
      Alert.alert('Pro feature', 'Multiple accounts require Ledgerline Pro.');
      router.push('/settings/pro');
      return;
    }
    const id = await repos.accounts.create({
      name: name.trim() || 'Account',
      quoteCurrency: 'USD',
    });
    setActive(id);
    await refetch();
  };

  const afterDelete = async (deletedId: string) => {
    await refetch();
    if (activeId === deletedId) {
      const next = (await repos.accounts.list())[0]?.id ?? null;
      setActive(next);
      if (next) {
        await repos.prefs.set('active_account_id', next);
      }
    }
  };

  const list = (
    <>
      {data?.map((a) => (
        <AccountRow
          key={a.id}
          id={a.id}
          name={a.name}
          quote={a.quote_currency}
          onRenamed={() => refetch()}
          onDeleted={() => afterDelete(a.id)}
          canDelete={(data?.length ?? 0) > 1}
        />
      ))}
      <Text variant="caption" style={{ marginTop: space.md }}>
        NEW ACCOUNT
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        accessibilityLabel="New account name"
      />
      <ButtonUi title="Create account" onPress={createSecond} />
      {__DEV__ && !hasPro ? (
        <ButtonUi
          title="Unlock Pro (dev mock)"
          variant="secondary"
          onPress={() => mockPurchase(repos)}
          style={{ marginTop: space.sm }}
        />
      ) : null}
    </>
  );

  return (
    <NavScreen title="Accounts" scroll>
      <ProGate fallback={list}>{list}</ProGate>
    </NavScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 12,
    padding: space.md,
    color: color.text,
    minHeight: 48,
    marginTop: space.xs,
    marginBottom: space.sm,
  },
  accountRow: { gap: space.sm, marginBottom: space.md },
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
