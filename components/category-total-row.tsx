import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getCategoryById } from '@/constants/categories';
import type { CategoryId } from '@/types/expense';
import { formatYen } from '@/utils/currency';

type CategoryTotalRowProps = {
  categoryId: CategoryId;
  amount: number;
};

export function CategoryTotalRow({ categoryId, amount }: CategoryTotalRowProps) {
  const category = getCategoryById(categoryId);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <ThemedText style={styles.emoji}>{category.emoji}</ThemedText>
        <ThemedText style={styles.label}>{category.label}</ThemedText>
      </View>
      <ThemedText style={styles.amount}>{formatYen(amount)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontSize: 14,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
