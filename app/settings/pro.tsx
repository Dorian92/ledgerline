import { useRepos } from '@/data/DbProvider';
import { usePro } from '@/state/pro';
import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { EmptyState } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { space } from '@/ui/tokens';

export default function ProScreen() {
  const repos = useRepos();
  const entitled = usePro((s) => s.entitled);
  const mockPurchase = usePro((s) => s.mockPurchase);
  return (
    <NavScreen title="Pro">
      <EmptyState
        title={entitled ? 'Pro active' : 'Ledgerline Pro'}
        body={
          entitled
            ? 'Insights, widget and multiple accounts are unlocked in this development build.'
            : 'One-time purchase unlocks Insights, the home-screen widget and multiple accounts. Billing ships in a later release.'
        }
      />
      {__DEV__ && !entitled ? (
        <ButtonUi title="Unlock Pro (dev mock only)" onPress={() => mockPurchase(repos)} />
      ) : null}
      {!__DEV__ ? (
        <Text variant="secondary" style={{ marginTop: space.md }}>
          Purchases are not available in this build yet.
        </Text>
      ) : null}
    </NavScreen>
  );
}
