import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { parseReceiptText } from '@/utils/receipt-parser';

export type ExtractedReceiptInfo = {
  amount: number | null;
  date: string | null;
  storeName: string | null;
};

type ReceiptExtractionPreviewProps = {
  ocrText: string | null;
  onApply: (result: ExtractedReceiptInfo) => void;
};

export function ReceiptExtractionPreview({ ocrText, onApply }: ReceiptExtractionPreviewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tint = colors.tint;
  const textColor = useThemeColor({}, 'text');
  const borderColor = colors.border;
  const placeholderColor = colors.placeholder;

  const parsed = useMemo(() => (ocrText ? parseReceiptText(ocrText) : null), [ocrText]);

  const [storeName, setStoreName] = useState('');
  const [dateText, setDateText] = useState('');
  const [amountText, setAmountText] = useState('');

  useEffect(() => {
    setStoreName(parsed?.storeName ?? '');
    setDateText(parsed?.date ?? '');
    setAmountText(parsed?.amount !== null && parsed?.amount !== undefined ? String(parsed.amount) : '');
  }, [parsed]);

  if (!ocrText) return null;

  const hasAnyResult = Boolean(storeName || dateText || amountText);

  const handleApply = () => {
    const amount = amountText.trim() ? Number(amountText) : null;
    onApply({
      amount: amount !== null && Number.isFinite(amount) ? amount : null,
      date: dateText.trim() || null,
      storeName: storeName.trim() || null,
    });
  };

  return (
    <View style={[styles.container, { borderColor }]}>
      <ThemedText style={styles.title}>抽出結果（確認・修正できます）</ThemedText>

      {!hasAnyResult && (
        <ThemedText style={styles.emptyText}>店名・日付・金額を読み取れませんでした</ThemedText>
      )}

      <View style={styles.field}>
        <ThemedText style={styles.label}>店名</ThemedText>
        <TextInput
          value={storeName}
          onChangeText={setStoreName}
          placeholder="読み取れませんでした"
          placeholderTextColor={placeholderColor}
          style={[styles.input, { borderColor, color: textColor }]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>日付（YYYY-MM-DD）</ThemedText>
        <TextInput
          value={dateText}
          onChangeText={setDateText}
          placeholder="読み取れませんでした"
          placeholderTextColor={placeholderColor}
          style={[styles.input, { borderColor, color: textColor }]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>合計金額</ThemedText>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          placeholder="読み取れませんでした"
          placeholderTextColor={placeholderColor}
          keyboardType="numeric"
          style={[styles.input, { borderColor, color: textColor }]}
        />
      </View>

      <Pressable
        onPress={handleApply}
        style={({ pressed }) => [
          styles.applyButton,
          { backgroundColor: tint, opacity: pressed ? 0.7 : 1 },
        ]}>
        <ThemedText style={styles.applyLabel}>この内容をフォームに反映する</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.6,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  applyButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  applyLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
