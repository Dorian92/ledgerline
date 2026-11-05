import { render, screen } from '@testing-library/react-native';

import HomeTab from '../(tabs)/index';

describe('HomeTab', () => {
  it('renders dashboard placeholder', () => {
    render(<HomeTab />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
});
