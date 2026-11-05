import React from 'react';
import { View, StyleSheet } from 'react-native';

import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <View style={styles.box}>
          <Text variant="title">Something went wrong</Text>
          <Text variant="secondary">{this.state.error.message}</Text>
          <ButtonUi title="Try again" onPress={() => this.setState({ error: null })} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    justifyContent: 'center',
    gap: space.md,
  },
});
