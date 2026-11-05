/* eslint-disable import/first */
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
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
