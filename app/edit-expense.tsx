import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ExpenseForm } from '@/components/expense-form';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { getBudget } from '@/services/budget-storage';
import { getExpenses, updateExpense, type NewExpenseInput } from '@/services/expense-storage';
import { checkAndNotifyBudgetStatus } from '@/services/notification-service';
import { deleteReceiptPhoto, saveReceiptPhoto } from '@/services/receipt-photo-storage';
import type { Expense } from '@/types/expense';
import { getMonthlyTotal } from '@/utils/expense-summary';

const SUCCESS_DISPLAY_MS = 700;

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSubmit = async (input: NewExpenseInput) => {
    if (!expense) return;

    // 新しい写真が選ばれた場合のみ永続領域へコピーし、元の写真が置き換え/削除された場合は古いファイルを削除する。
    let photoUri = input.photoUri;
    if (photoUri && photoUri !== expense.photoUri) {
      photoUri = (await saveReceiptPhoto(photoUri)) ?? undefined;
    }
    if (expense.photoUri && expense.photoUri !== photoUri) {
      deleteReceiptPhoto(expense.photoUri);
    }

    const updated = await updateExpense(expense.id, { ...input, photoUri });
    if (!updated) {
      throw new Error('更新に失敗しました。もう一度お試しください。');
    }

    const [expenses, budget] = await Promise.all([getExpenses(), getBudget()]);
    await checkAndNotifyBudgetStatus(getMonthlyTotal(expenses), budget);

    setShowSuccess(true);
    setTimeout(() => router.back(), SUCCESS_DISPLAY_MS);
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

  return (
    <>
      <ScreenContainer edges={['bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ExpenseForm
            initialValues={{
              amount: expense.amount,
              date: expense.date,
              categoryId: expense.categoryId,
              memo: expense.memo,
              photoUri: expense.photoUri,
              ocrText: expense.ocrText,
            }}
            onSubmit={handleSubmit}
            submitLabel="変更を保存"
          />
        </ScrollView>
      </ScreenContainer>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <ThemedText style={styles.successIcon}>✅</ThemedText>
          <ThemedText style={styles.successText}>保存しました</ThemedText>
        </View>
      )}
    </>
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
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    gap: 8,
  },
  successIcon: {
    fontSize: 48,
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
