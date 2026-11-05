import { render, fireEvent, screen } from '@testing-library/react-native';

import { Chip, EmptyState, Segmented } from '../primitives';
import { Pill } from '../Pill';
import { TabBar } from '../TabBar';

describe('Segmented', () => {
  it('calls onChange', () => {
    const onChange = jest.fn();
    render(
      <Segmented
        options={[
          { value: '7D', label: '7D' },
          { value: '30D', label: '30D' },
        ]}
        value="7D"
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByLabelText('30D'));
    expect(onChange).toHaveBeenCalledWith('30D');
  });
});

describe('Chip', () => {
  it('toggles selection state', () => {
    const onPress = jest.fn();
    render(<Chip label="Calm" selected={false} onPress={onPress} />);
    fireEvent.press(screen.getByText('Calm'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Pill', () => {
  it('renders text', () => {
    render(<Pill label="DEMO DATA" variant="demo" />);
    expect(screen.getByText('DEMO DATA')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders action', () => {
    render(<EmptyState title="Empty" body="No data" actionLabel="Add" onAction={() => {}} />);
    expect(screen.getByText('Add')).toBeTruthy();
  });
});

describe('TabBar', () => {
  it('renders four tabs', () => {
    const navigation = { navigate: jest.fn() } as never;
    const state = {
      index: 0,
      routes: [
        { key: '1', name: 'index' },
        { key: '2', name: 'trades' },
        { key: '3', name: 'insights' },
        { key: '4', name: 'settings' },
      ],
    } as never;
    render(
      <TabBar
        state={state}
        navigation={navigation}
        descriptors={{} as never}
        insets={{} as never}
      />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});
