import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useDb } from '@/data/DbProvider';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  const { refreshMode } = useDb();

  return (
    <View style={styles.container}>
      <Text variant="title">Ledgerline</Text>
      <Text variant="secondary" style={styles.sub}>
        A private trading journal that lives on your phone.
      </Text>
      <Text variant="secondary">Offline. No account. Import CSVs when you are ready.</Text>
      <ButtonUi
        title="Start my journal"
        onPress={() => router.push('/(onboarding)/create-account')}
        style={styles.btn}
      />
      <ButtonUi
        title="Explore with demo data"
        variant="secondary"
        onPress={async () => {
          await refreshMode('demo');
          router.replace('/(tabs)');
        }}
        style={styles.btn}
      />
      <Text variant="caption" style={styles.footer}>
        Ledgerline is a journal, not financial advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    justifyContent: 'center',
    gap: space.md,
  },
  sub: { marginBottom: space.sm },
  btn: { marginTop: space.sm },
  footer: { marginTop: space.xxl, textTransform: 'none' },
});
