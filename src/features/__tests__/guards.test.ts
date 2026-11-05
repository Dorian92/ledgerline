import { renderHook } from '@testing-library/react-native';

import { useSession } from '@/state/session';

import { useRealModeOnly } from '../guards';

describe('useRealModeOnly', () => {
  afterEach(() => {
    useSession.setState({ mode: 'unset', activeAccountId: null });
  });

  it('blocks demo mode', () => {
    useSession.setState({ mode: 'demo' });
    const { result } = renderHook(() => useRealModeOnly());
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toMatch(/demo/i);
  });

  it('allows real mode', () => {
    useSession.setState({ mode: 'real' });
    const { result } = renderHook(() => useRealModeOnly());
    expect(result.current.allowed).toBe(true);
  });
});
