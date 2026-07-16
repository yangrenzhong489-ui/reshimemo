import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { CategoryPicker } from '@/components/category-picker';
import { CategorySuggestions } from '@/components/category-suggestions';
import { DateStepper } from '@/components/date-stepper';
import { OcrReader } from '@/components/ocr-reader';
import { ReceiptExtractionPreview, type ExtractedReceiptInfo } from '@/components/receipt-extraction-preview';
import { ReceiptPhotoPicker } from '@/components/receipt-photo-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { predictCategoryCandidates, type CategoryCandidate } from '@/services/category-prediction';
import type { NewExpenseInput } from '@/services/expense-storage';
import type { CategoryId } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { formatDateLabel, todayString } from '@/utils/date';
import { isAmountUnusuallyLarge, isFutureDate, validateExpenseForm } from '@/utils/validation';

/** Alert.alertの「キャンセル/続行」選択をPromiseで扱えるようにするヘルパー。 */
function confirmAsync(title: string, message: string, confirmLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

type ExpenseFormProps = {
  initialValues?: {
    amount: number;
    date: string;
    categoryId: CategoryId;
    memo?: string;
    photoUri?: string;
    ocrText?: string;
  };
  onSubmit: (input: NewExpenseInput) => void | Promise<void>;
  submitLabel?: string;
};

export function ExpenseForm({ initialValues, onSubmit, submitLabel = '保存' }: ExpenseFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const textColor = useThemeColor({}, 'text');

  const [amountText, setAmountText] = useState(
    initialValues ? String(initialValues.amount) : ''
  );
  const [date, setDate] = useState(initialValues?.date ?? todayString());
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initialValues?.categoryId ?? null);
  const [memo, setMemo] = useState(initialValues?.memo ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initialValues?.photoUri ?? null);
  const [ocrText, setOcrText] = useState<string | null>(initialValues?.ocrText ?? null);
  // 新規追加時のみ自動判定を行う（既存の支出を編集する際は、既にあるカテゴリを勝手に上書きしない）。
  const [isCategoryAutoSet, setIsCategoryAutoSet] = useState(!initialValues);
  const [categoryCandidates, setCategoryCandidates] = useState<CategoryCandidate[]>([]);

  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateExpenseForm({ amountText, date, categoryId, memo });

    setAmountError(validation.errors.amount ?? null);
    setDateError(validation.errors.date ?? null);
    setCategoryError(validation.errors.category ?? null);
    setMemoError(validation.errors.memo ?? null);

    if (!validation.isValid) return;

    if (isAmountUnusuallyLarge(amountText)) {
      const confirmed = await confirmAsync(
        '金額が高額です',
        `${formatYen(Number(amountText))} で保存しますか？`,
        '保存する'
      );
      if (!confirmed) return;
    }

    if (isFutureDate(date)) {
      const confirmed = await confirmAsync(
        '未来の日付です',
        `${formatDateLabel(date)} として保存しますか？`,
        '保存する'
      );
      if (!confirmed) return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        amount: Number(amountText),
        date,
        categoryId: categoryId as CategoryId,
        memo: memo.trim() ? memo.trim() : undefined,
        photoUri: photoUri ?? undefined,
        ocrText: ocrText ?? undefined,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '保存に失敗しました。もう一度お試しください。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // メモ/OCRテキストの内容からカテゴリ候補を判定する（候補一覧は常に更新し、
  // ユーザーがまだ手動でカテゴリを選んでいない間だけ最有力候補を自動選択する）。
  // 判定は過去の支出データを読み込むため、入力中に毎回実行しないよう少し待ってから行う。
  useEffect(() => {
    if (!memo.trim() && !ocrText) {
      setCategoryCandidates([]);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(() => {
      predictCategoryCandidates({ memo, ocrText: ocrText ?? undefined }).then((candidates) => {
        if (!active) return;
        setCategoryCandidates(candidates);
        if (isCategoryAutoSet && candidates[0]) {
          setCategoryId(candidates[0].categoryId);
        }
      });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [memo, ocrText, isCategoryAutoSet]);

  const handleSelectCategory = (id: CategoryId) => {
    setCategoryId(id);
    setIsCategoryAutoSet(false);
    if (categoryError) setCategoryError(null);
  };

  const handleApplyExtraction = (result: ExtractedReceiptInfo) => {
    if (result.amount !== null) {
      setAmountText(String(result.amount));
      setAmountError(null);
    }
    if (result.date !== null) {
      setDate(result.date);
      setDateError(null);
    }
    if (result.storeName !== null) {
      setMemo(result.storeName);
      setMemoError(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText style={styles.label}>金額</ThemedText>
        <View
          style={[
            styles.amountRow,
            { borderColor: amountError ? colors.danger : colors.border },
          ]}>
          <ThemedText style={[styles.yen, { color: colors.tint }]}>¥</ThemedText>
          <TextInput
            value={amountText}
            onChangeText={(text) => {
              setAmountText(text);
              if (amountError) setAmountError(null);
            }}
            placeholder="0"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            style={[styles.amountInput, { color: textColor }]}
          />
        </View>
        {amountError && (
          <ThemedText style={[styles.fieldError, { color: colors.danger }]}>
            ⚠️ {amountError}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>日付</ThemedText>
        <DateStepper
          value={date}
          onChange={(next) => {
            setDate(next);
            if (dateError) setDateError(null);
          }}
        />
        {dateError && (
          <ThemedText style={[styles.fieldError, { color: colors.danger }]}>
            ⚠️ {dateError}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>カテゴリ</ThemedText>
        {isCategoryAutoSet && categoryId !== null && (
          <ThemedText style={styles.autoHint}>🤖 自動で選択しました（タップで変更できます）</ThemedText>
        )}
        <CategoryPicker selectedId={categoryId} onSelect={handleSelectCategory} />
        <CategorySuggestions
          candidates={categoryCandidates}
          selectedId={categoryId}
          onSelect={handleSelectCategory}
        />
        {categoryError && (
          <ThemedText style={[styles.fieldError, { color: colors.danger }]}>
            ⚠️ {categoryError}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>メモ（任意）</ThemedText>
        <TextInput
          value={memo}
          onChangeText={(text) => {
            setMemo(text);
            if (memoError) setMemoError(null);
          }}
          placeholder="例: コンビニでお弁当"
          placeholderTextColor={colors.placeholder}
          style={[
            styles.memoInput,
            { borderColor: memoError ? colors.danger : colors.border, color: textColor },
          ]}
          multiline
        />
        {memoError && (
          <ThemedText style={[styles.fieldError, { color: colors.danger }]}>
            ⚠️ {memoError}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>レシート写真（任意）</ThemedText>
        <ReceiptPhotoPicker
          value={photoUri}
          onChange={(uri) => {
            setPhotoUri(uri);
            setOcrText(null);
          }}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>OCR読み取り（任意）</ThemedText>
        <OcrReader photoUri={photoUri} value={ocrText} onChange={setOcrText} />
        <ReceiptExtractionPreview ocrText={ocrText} onApply={handleApplyExtraction} />
      </View>

      {submitError && (
        <ThemedText style={[styles.submitError, { color: colors.danger }]}>{submitError}</ThemedText>
      )}

      <AppButton
        label={submitting ? '保存中…' : submitLabel}
        onPress={handleSubmit}
        disabled={submitting}
        loading={submitting}
      />
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
    paddingHorizontal: 14,
  },
  yen: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
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
    fontSize: 13,
  },
  autoHint: {
    fontSize: 12,
    opacity: 0.6,
  },
  submitError: {
    fontSize: 14,
    textAlign: 'center',
  },
});
