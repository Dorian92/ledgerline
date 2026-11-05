/* eslint-disable import/first */
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text>{href}</Text>,
  };
});

import { useSession } from '@/state/session';
import Index from '../index';

describe('Index redirect', () => {
  it('sends unset users to onboarding', () => {
    useSession.setState({ mode: 'unset' });
    render(<Index />);
    expect(screen.getByText('/(onboarding)/welcome')).toBeTruthy();
  });
});
