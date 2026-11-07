import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { useDb, useRepos } from '@/data/DbProvider';
import { QuoteCurrencyField } from '@/features/accounts/QuoteCurrencyField';
import type { QuoteCurrency } from '@/domain/money/types';
import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function CreateAccountScreen() {
  const [name, setName] = useState('Main');
  const [quoteCurrency, setQuoteCurrency] = useState<QuoteCurrency>('USD');
  const router = useRouter();
  const repos = useRepos();
  const { refreshMode } = useDb();

  const onCreate = async () => {
    const id = await repos.accounts.create({
      name: name.trim() || 'Main',
      quoteCurrency,
    });
    await repos.prefs.set('mode', 'real');
    await repos.prefs.set('active_account_id', id);
    await refreshMode('real');
    router.replace('/(tabs)');
  };

  const onCancel = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <NavScreen title="Start my journal" backLabel="Close" onBack={onCancel}>
      <Text variant="caption">Account name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor={color.textMuted}
        accessibilityLabel="Account name"
      />
      <QuoteCurrencyField value={quoteCurrency} onChange={setQuoteCurrency} />
      <ButtonUi title="Create account" onPress={onCreate} />
      <ButtonUi
        title="Cancel"
        variant="secondary"
        onPress={onCancel}
        style={{ marginTop: space.md }}
      />
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
    marginBottom: space.lg,
  },
});
