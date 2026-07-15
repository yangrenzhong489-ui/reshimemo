import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ExpenseForm } from '@/components/expense-form';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { addExpense, type NewExpenseInput } from '@/services/expense-storage';
import { saveReceiptPhoto } from '@/services/receipt-photo-storage';

const SUCCESS_DISPLAY_MS = 700;

export default function AddExpenseScreen() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (input: NewExpenseInput) => {
    // 写真が選択されている場合は、保存時にアプリの永続領域へコピーしてからそのURIを使う。
    const photoUri = input.photoUri ? (await saveReceiptPhoto(input.photoUri)) ?? undefined : undefined;

    const saved = await addExpense({ ...input, photoUri });
    if (!saved) {
      throw new Error('保存に失敗しました。もう一度お試しください。');
    }

    setShowSuccess(true);
    setTimeout(() => router.back(), SUCCESS_DISPLAY_MS);
  };

  return (
    <>
      <ScreenContainer edges={['bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ExpenseForm onSubmit={handleSubmit} submitLabel="支出を保存" />
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
