import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from './Text';
import { color, radius, space } from './tokens';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.pill, selected && styles.pillActive]}
          >
            <Text variant="secondary" style={selected && styles.pillTextActive}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: color.violet, borderColor: color.violet },
  pillTextActive: { color: color.text, fontWeight: '600' },
});

export function StatTile({
  label,
  value,
  hidden,
}: {
  label: string;
  value: string;
  hidden?: boolean;
}) {
  const display = hidden && !value.startsWith('—') && value !== '••••' ? '••••' : value;
  return (
    <View
      style={statStyles.tile}
      accessibilityLabel={hidden ? `${label} hidden` : `${label} ${display}`}
    >
      <Text variant="caption">{label}</Text>
      <Text variant="mono" style={statStyles.value}>
        {display}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.md,
    gap: space.xs,
  },
  value: { fontSize: 18, fontWeight: '600' },
});

export function Fab({
  onPress,
  testID,
  style,
}: {
  onPress: () => void;
  testID?: string;
  style?: object;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Add trade"
      onPress={onPress}
      style={[fabStyles.fab, style]}
    >
      <Text style={fabStyles.plus}>+</Text>
    </Pressable>
  );
}

const fabStyles = StyleSheet.create({
  fab: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: color.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { color: color.text, fontSize: 32, fontWeight: '300' },
});

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[chipStyles.chip, selected && chipStyles.selected]}
    >
      <Text variant="secondary">{label}</Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  selected: { backgroundColor: color.violet, borderColor: color.violet },
});

export function Banner({
  title,
  body,
  tone = 'danger',
}: {
  title: string;
  body: string;
  tone?: 'danger' | 'warning' | 'info';
}) {
  const border = tone === 'danger' ? color.red : tone === 'warning' ? color.amber : color.violet;
  return (
    <View style={[bannerStyles.box, { borderColor: border }]}>
      <Text variant="section" style={{ color: border }}>
        {title}
      </Text>
      <Text variant="secondary">{body}</Text>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    backgroundColor: color.card,
    gap: space.xs,
  },
});

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <Text variant="section">{title}</Text>
      <Text variant="secondary">{body}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={emptyStyles.btn}>
          <Text style={{ color: color.violet }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { gap: space.sm, padding: space.lg },
  btn: { minHeight: 48, justifyContent: 'center' },
});

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      body={message}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
}

export function Skeleton({
  height = 16,
  width = '100%' as const,
}: {
  height?: number;
  width?: number | `${number}%`;
}) {
  return <View style={[skStyles.sk, { height, width }]} />;
}

const skStyles = StyleSheet.create({
  sk: { backgroundColor: color.cardRaised, borderRadius: radius.control },
});

export function ScreenHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={hdrStyles.row}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text variant="caption">{eyebrow}</Text> : null}
        <Text variant="title">{title}</Text>
      </View>
      {right}
    </View>
  );
}

const hdrStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: space.lg,
    gap: space.md,
  },
});

export function Divider(props: ViewProps) {
  return <View {...props} style={[divStyles.line, props.style]} />;
}

const divStyles = StyleSheet.create({
  line: { height: 1, backgroundColor: color.border, marginVertical: space.sm },
});
