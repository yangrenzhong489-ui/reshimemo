import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CategoryId } from '@/types/expense';

type CategoryFilterChipsProps = {
  selectedId: CategoryId | null;
  onSelect: (id: CategoryId | null) => void;
};

export function CategoryFilterChips({ selectedId, onSelect }: CategoryFilterChipsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tint = colors.tint;
  const borderColor = colors.border;

  return (
    <View style={styles.grid}>
      <Pressable
        onPress={() => onSelect(null)}
        style={[
          styles.chip,
          { borderColor: selectedId === null ? tint : borderColor },
          selectedId === null && { backgroundColor: tint },
        ]}>
        <ThemedText style={[styles.label, selectedId === null && styles.labelSelected]}>
          すべて
        </ThemedText>
      </Pressable>

      {CATEGORIES.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={[
              styles.chip,
              { borderColor: selected ? category.color : borderColor },
              selected && { backgroundColor: category.color },
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
