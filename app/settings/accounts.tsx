import { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { ProGate, usePro } from '@/state/pro';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function AccountsSettingsScreen() {
  const repos = useRepos();
  const router = useRouter();
  const setActive = useSession((s) => s.setActiveAccountId);
  const entitled = usePro((s) => s.entitled);
  const [name, setName] = useState('Journal 2');
  const { data, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => repos.accounts.list(),
  });

  const createSecond = async () => {
    if (!entitled && (data?.length ?? 0) >= 1) {
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

  return (
    <View style={styles.container}>
      <ScreenHeader title="Accounts" />
      <ProGate
        fallback={data?.map((a) => (
          <Text key={a.id} variant="body">
            {a.name} · {a.quote_currency}
          </Text>
        ))}
      >
        {data?.map((a) => (
          <Text key={a.id} variant="body" accessibilityRole="text">
            {a.name} · {a.quote_currency}
          </Text>
        ))}
      </ProGate>
      <Text variant="caption">NEW ACCOUNT</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />
      <ButtonUi title="Create account" onPress={createSecond} />
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
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 12,
    padding: space.md,
    color: color.text,
  },
});
