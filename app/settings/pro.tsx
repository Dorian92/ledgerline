import { View, StyleSheet } from 'react-native';

import { useRepos } from '@/data/DbProvider';
import { usePro } from '@/state/pro';
import { ScreenHeader, EmptyState } from '@/ui/primitives';
import { ButtonUi } from '@/ui/Button';
import { color, space } from '@/ui/tokens';

export default function ProScreen() {
  const repos = useRepos();
  const entitled = usePro((s) => s.entitled);
  const mockPurchase = usePro((s) => s.mockPurchase);
  return (
    <View style={styles.container}>
      <ScreenHeader title="Pro" />
      <EmptyState
        title={entitled ? 'Pro active (mock)' : 'Ledgerline Pro'}
        body={
          entitled
            ? 'Insights extras, widget and multi-account are unlocked in this mock build.'
            : 'Mock billing for development. Play Billing ships in step 27.'
        }
      />
      {!entitled ? <ButtonUi title="Mock purchase" onPress={() => mockPurchase(repos)} /> : null}
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
