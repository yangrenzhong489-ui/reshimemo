import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getCategoryById } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CategoryCandidate } from '@/services/category-prediction';
import type { CategoryId } from '@/types/expense';

const MAX_VISIBLE_CANDIDATES = 3;

type CategorySuggestionsProps = {
  candidates: CategoryCandidate[];
  selectedId: CategoryId | null;
  onSelect: (categoryId: CategoryId) => void;
};

export function CategorySuggestions({ candidates, selectedId, onSelect }: CategorySuggestionsProps) {
  const colorScheme = useColorScheme();
  const borderColor = Colors[colorScheme ?? 'light'].border;

  if (candidates.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>🤖 カテゴリ候補</ThemedText>
      {candidates.slice(0, MAX_VISIBLE_CANDIDATES).map((candidate) => {
        const category = getCategoryById(candidate.categoryId);
        const selected = candidate.categoryId === selectedId;

        return (
          <Pressable
            key={candidate.categoryId}
            onPress={() => onSelect(candidate.categoryId)}
            style={({ pressed }) => [
              styles.row,
              { borderColor: selected ? category.color : borderColor },
              selected && { backgroundColor: `${category.color}1A` },
              pressed && styles.pressed,
            ]}>
            <View style={styles.rowHeader}>
              <ThemedText style={styles.rowLabel}>
                {category.emoji} {category.label}
              </ThemedText>
              <ThemedText style={styles.confidence}>{Math.round(candidate.confidence * 100)}%</ThemedText>
            </View>
            <ThemedText style={styles.reason}>{candidate.reason}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  row: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  confidence: {
    fontSize: 12,
    opacity: 0.6,
  },
  reason: {
    fontSize: 12,
    opacity: 0.7,
  },
});
