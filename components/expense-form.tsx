import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { DateStepper } from '@/components/date-stepper';
import { ReceiptPhotoPicker } from '@/components/receipt-photo-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { NewExpenseInput } from '@/services/expense-storage';
import type { CategoryId } from '@/types/expense';
import { todayString } from '@/utils/date';

const ERROR_COLOR = '#e0245e';

type ExpenseFormProps = {
  initialValues?: {
    amount: number;
    date: string;
    categoryId: CategoryId;
    memo?: string;
    photoUri?: string;
  };
  onSubmit: (input: NewExpenseInput) => void | Promise<void>;
  submitLabel?: string;
};

export function ExpenseForm({ initialValues, onSubmit, submitLabel = '保存' }: ExpenseFormProps) {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const textColor = useThemeColor({}, 'text');
  const borderColor = colorScheme === 'dark' ? '#3a3d3e' : '#e2e2e2';
  const placeholderColor = colorScheme === 'dark' ? '#6b7280' : '#9ca3af';

  const [amountText, setAmountText] = useState(
    initialValues ? String(initialValues.amount) : ''
  );
  const [date, setDate] = useState(initialValues?.date ?? todayString());
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initialValues?.categoryId ?? null);
  const [memo, setMemo] = useState(initialValues?.memo ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initialValues?.photoUri ?? null);

  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amount = Number(amountText);
    let hasError = false;

    if (!amountText.trim()) {
      setAmountError('金額を入力してください');
      hasError = true;
    } else if (Number.isNaN(amount) || amount <= 0) {
      setAmountError('金額は1円以上の数字で入力してください');
      hasError = true;
    } else {
      setAmountError(null);
    }

    if (!categoryId) {
      setCategoryError('カテゴリを選択してください');
      hasError = true;
    } else {
      setCategoryError(null);
    }

    if (hasError) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        amount,
        date,
        categoryId: categoryId as CategoryId,
        memo: memo.trim() ? memo.trim() : undefined,
        photoUri: photoUri ?? undefined,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '保存に失敗しました。もう一度お試しください。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText style={styles.label}>金額</ThemedText>
        <View
          style={[
            styles.amountRow,
            { borderColor: amountError ? ERROR_COLOR : borderColor },
          ]}>
          <ThemedText style={styles.yen}>¥</ThemedText>
          <TextInput
            value={amountText}
            onChangeText={(text) => {
              setAmountText(text);
              if (amountError) setAmountError(null);
            }}
            placeholder="0"
            placeholderTextColor={placeholderColor}
            keyboardType="numeric"
            style={[styles.amountInput, { color: textColor }]}
          />
        </View>
        {amountError && <ThemedText style={styles.fieldError}>⚠️ {amountError}</ThemedText>}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>日付</ThemedText>
        <DateStepper value={date} onChange={setDate} />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>カテゴリ</ThemedText>
        <CategoryPicker
          selectedId={categoryId}
          onSelect={(id) => {
            setCategoryId(id);
            if (categoryError) setCategoryError(null);
          }}
        />
        {categoryError && <ThemedText style={styles.fieldError}>⚠️ {categoryError}</ThemedText>}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>メモ（任意）</ThemedText>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="例: コンビニでお弁当"
          placeholderTextColor={placeholderColor}
          style={[styles.memoInput, { borderColor, color: textColor }]}
          multiline
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>レシート写真（任意）</ThemedText>
        <ReceiptPhotoPicker value={photoUri} onChange={setPhotoUri} />
      </View>

      {submitError && <ThemedText style={styles.submitError}>{submitError}</ThemedText>}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: tint, opacity: submitting || pressed ? 0.7 : 1 },
        ]}>
        <ThemedText style={styles.submitLabel}>{submitting ? '保存中…' : submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  yen: {
    fontSize: 20,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 12,
  },
  memoInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 60,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: ERROR_COLOR,
    fontSize: 13,
  },
  submitError: {
    color: ERROR_COLOR,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
