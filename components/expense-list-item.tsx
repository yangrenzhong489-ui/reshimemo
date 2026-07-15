import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getCategoryById } from '@/constants/categories';
import type { Expense } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { formatDateLabel } from '@/utils/date';

type ExpenseListItemProps = {
  expense: Expense;
};

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  const category = getCategoryById(expense.categoryId);

  return (
    <View style={styles.row}>
      {expense.photoUri ? (
        <Image source={{ uri: expense.photoUri }} style={styles.thumbnail} contentFit="cover" />
      ) : (
        <View style={[styles.iconBadge, { backgroundColor: category.color }]}>
          <ThemedText style={styles.icon}>{category.emoji}</ThemedText>
        </View>
      )}

      <View style={styles.info}>
        <ThemedText style={styles.category}>{category.label}</ThemedText>
        <ThemedText style={styles.date} numberOfLines={1}>
          {formatDateLabel(expense.date)}
          {expense.memo ? ` ・ ${expense.memo}` : ''}
        </ThemedText>
      </View>

      <ThemedText style={styles.amount}>{formatYen(expense.amount)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
