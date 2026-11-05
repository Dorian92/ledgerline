import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../index';

describe('HomeScreen', () => {
  it('renders Ledgerline', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Ledgerline')).toBeTruthy();
  });
});
