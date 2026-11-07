import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export function NavScreen({
  title,
  eyebrow,
  right,
  backLabel = 'Back',
  onBack,
  scroll = false,
  children,
  contentContainerStyle,
  footer,
}: {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
  backLabel?: 'Back' | 'Close';
  onBack?: () => void;
  scroll?: boolean;
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const body = (
    <>
      <ScreenHeader eyebrow={eyebrow} title={title} right={right} />
      {children}
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.navRow}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          style={styles.backBtn}
        >
          <Text variant="secondary">{backLabel === 'Close' ? '✕ Close' : '← Back'}</Text>
        </Pressable>
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentContainerStyle]}>{body}</View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  navRow: { paddingHorizontal: space.lg },
  backBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingRight: space.md,
  },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl },
});
