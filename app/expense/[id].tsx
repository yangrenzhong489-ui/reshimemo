import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { EmptyState } from '@/components/empty-state';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { getCategoryById } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteExpense, getExpenses } from '@/services/expense-storage';
import { deleteReceiptPhoto } from '@/services/receipt-photo-storage';
import type { Expense } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { formatDateLabel } from '@/utils/date';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const borderColor = Colors[colorScheme ?? 'light'].border;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getExpenses().then((data) => {
        if (active) {
          setExpense(data.find((item) => item.id === id) ?? null);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  const handleDelete = () => {
    if (!expense) return;

    Alert.alert('この支出を削除しますか？', 'この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          if (expense.photoUri) {
            deleteReceiptPhoto(expense.photoUri);
          }
          await deleteExpense(expense.id);
          router.back();
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!expense) return;
    router.push({ pathname: '/edit-expense', params: { id: expense.id } });
  };

  if (loaded && !expense) {
    return (
      <ScreenContainer edges={['bottom']} style={styles.container}>
        <EmptyState title="この支出は見つかりませんでした" description="削除された可能性があります" />
      </ScreenContainer>
    );
  }

  if (!expense) {
    return <ScreenContainer edges={['bottom']} style={styles.container} />;
  }

  const category = getCategoryById(expense.categoryId);

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.amountBlock}>
          <ThemedText style={styles.amount}>{formatYen(expense.amount)}</ThemedText>
          <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
            <ThemedText style={styles.categoryText}>
              {category.emoji} {category.label}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.row, { borderColor }]}>
          <ThemedText style={styles.rowLabel}>日付</ThemedText>
          <ThemedText style={styles.rowValue}>{formatDateLabel(expense.date)}</ThemedText>
        </View>

        <View style={[styles.row, { borderColor }]}>
          <ThemedText style={styles.rowLabel}>メモ</ThemedText>
          <ThemedText style={styles.rowValue}>{expense.memo || 'メモはありません'}</ThemedText>
        </View>

        <View style={styles.photoSection}>
          <ThemedText style={styles.rowLabel}>レシート写真</ThemedText>
          {expense.photoUri ? (
            <Image source={{ uri: expense.photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <ThemedText style={styles.noPhoto}>写真はありません</ThemedText>
          )}
        </View>

        {expense.ocrText && (
          <View style={[styles.row, { borderColor }]}>
            <ThemedText style={styles.rowLabel}>OCR読み取り結果</ThemedText>
            <ThemedText style={styles.rowValue}>{expense.ocrText}</ThemedText>
          </View>
        )}

        <View style={styles.actions}>
          <AppButton label="編集する" onPress={handleEdit} variant="primaryOutline" style={styles.actionButton} />
          <AppButton label="削除する" onPress={handleDelete} variant="danger" style={styles.actionButton} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  amountBlock: {
    alignItems: 'center',
    gap: 12,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 4,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  rowValue: {
    fontSize: 16,
  },
  photoSection: {
    gap: 8,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  noPhoto: {
    fontSize: 14,
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});
