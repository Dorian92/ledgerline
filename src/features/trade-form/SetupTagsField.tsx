import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useCreateTag, useTags } from '@/data/queries/useTrades';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export function SetupTagsField({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const addTag = async () => {
    const name = newName.trim().slice(0, 24);
    if (!name) return;
    const id = await createTag.mutateAsync(name);
    setNewName('');
    setAdding(false);
    onChange([...selected, id]);
  };

  return (
    <View style={styles.wrap}>
      <Text variant="caption">SETUP</Text>
      <View style={styles.row}>
        {(tags ?? []).map((t) => (
          <Pressable
            key={t.id}
            onPress={() => toggle(t.id)}
            style={[styles.chip, selected.includes(t.id) && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: selected.includes(t.id) }}
          >
            <Text variant="caption" style={{ textTransform: 'none' }}>
              {t.name}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setAdding(true)} style={styles.chip} accessibilityRole="button">
          <Text variant="caption" style={{ textTransform: 'none' }}>
            + Add
          </Text>
        </Pressable>
      </View>
      {adding ? (
        <View style={styles.addRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Tag name"
            placeholderTextColor={color.textMuted}
            style={styles.input}
            maxLength={24}
          />
          <Pressable onPress={addTag} accessibilityRole="button">
            <Text style={{ color: color.violet }}>Save</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  chipOn: { borderColor: color.violet, backgroundColor: color.violetSoft },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: space.sm,
    color: color.text,
  },
});
