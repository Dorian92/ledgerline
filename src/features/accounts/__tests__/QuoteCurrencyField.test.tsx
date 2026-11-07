import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { QuoteCurrencyField } from '../QuoteCurrencyField';

describe('QuoteCurrencyField', () => {
  it('calls onChange when USDC is selected', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<QuoteCurrencyField value="USD" onChange={onChange} />);
    fireEvent.press(getByLabelText('USDC'));
    expect(onChange).toHaveBeenCalledWith('USDC');
  });
});
