import { Redirect } from 'expo-router';

import { useSession } from '@/state/session';

export default function Index() {
  const mode = useSession((s) => s.mode);
  if (mode === 'unset') {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  return <Redirect href="/(tabs)" />;
}
