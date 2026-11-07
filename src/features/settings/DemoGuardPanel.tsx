import { useRouter } from 'expo-router';

import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';
import { space } from '@/ui/tokens';

export function DemoGuardPanel({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return (
    <NavScreen title={title}>
      <Text variant="secondary" style={{ marginBottom: space.lg }}>
        {body}
      </Text>
      <Text variant="secondary">
        Demo data is read-only. Start a journal on this device to import or back up trades.
      </Text>
      <ButtonUi
        title="Start my journal"
        onPress={() => router.push('/(onboarding)/create-account')}
        style={{ marginTop: space.lg }}
      />
      <ButtonUi
        title="Back"
        variant="secondary"
        onPress={() => router.back()}
        style={{ marginTop: space.md }}
      />
    </NavScreen>
  );
}
