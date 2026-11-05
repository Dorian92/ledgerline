import { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { useDb, useRepos } from '@/data/DbProvider';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function CreateAccountScreen() {
  const [name, setName] = useState('Main');
  const router = useRouter();
  const repos = useRepos();
  const { refreshMode } = useDb();

  const onCreate = async () => {
    const id = await repos.accounts.create({ name: name.trim() || 'Main', quoteCurrency: 'USD' });
    await repos.prefs.set('mode', 'real');
    await repos.prefs.set('active_account_id', id);
    await refreshMode('real');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text variant="title">Start my journal</Text>
      <Text variant="caption">Account name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor={color.textMuted}
      />
      <ButtonUi title="Create account" onPress={onCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    paddingTop: 64,
    gap: space.md,
  },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 12,
    padding: space.md,
    color: color.text,
    minHeight: 48,
  },
});
