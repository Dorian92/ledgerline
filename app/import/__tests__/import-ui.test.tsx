/* eslint-disable import/first */
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/data/DbProvider', () => ({
  useRepos: () => ({
    imports: { existingFingerprints: async () => new Set() },
  }),
}));

jest.mock('@/state/session', () => ({
  useSession: (sel: (s: { activeAccountId: string }) => unknown) => sel({ activeAccountId: 'acc' }),
}));

jest.mock('@/features/guards', () => ({
  useRealModeOnly: () => ({ allowed: true, reason: null }),
}));

import ImportIndexScreen from '../index';

describe('ImportIndexScreen', () => {
  it('shows Not yet on exchange tiles', () => {
    render(<ImportIndexScreen />);
    expect(screen.getAllByText('Not yet').length).toBe(3);
  });
});
