import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CATEGORIES } from '@/constants/categories';
import type { CategoryId } from '@/types/expense';

type CategoryPickerProps = {
  selectedId: CategoryId | null;
  onSelect: (id: CategoryId) => void;
};

export function CategoryPicker({ selectedId, onSelect }: CategoryPickerProps) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: category.color },
              selected && { backgroundColor: category.color },
              pressed && styles.chipPressed,
            ]}>
            <ThemedText style={styles.emoji}>{category.emoji}</ThemedText>
            <ThemedText style={[styles.label, selected && styles.labelSelected]}>
              {category.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipPressed: {
    opacity: 0.6,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
  },
  labelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
