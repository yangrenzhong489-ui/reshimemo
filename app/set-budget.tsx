import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBudget, setBudget } from '@/services/budget-storage';

const ERROR_COLOR = '#e0245e';

export default function SetBudgetScreen() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const textColor = useThemeColor({}, 'text');
  const borderColor = colorScheme === 'dark' ? '#3a3d3e' : '#e2e2e2';
  const placeholderColor = colorScheme === 'dark' ? '#6b7280' : '#9ca3af';

  const [amountText, setAmountText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getBudget().then((value) => {
      if (value !== null) {
        setAmountText(String(value));
      }
      setLoaded(true);
    });
  }, []);

  const handleSubmit = async () => {
    const amount = Number(amountText);

    if (!amountText.trim()) {
      setErrorMessage('予算金額を入力してください');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setErrorMessage('予算金額は1円以上の数字で入力してください');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const success = await setBudget(amount);
      if (!success) {
        setErrorMessage('保存に失敗しました。もう一度お試しください。');
        return;
      }
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return <ScreenContainer edges={['bottom']} style={styles.container} />;
  }

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.description}>
          毎月の支出の目安となる予算を設定します。今月の支出がこの金額の80%を超えると注意、100%を超えると警告が表示されます。
        </ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>月の予算</ThemedText>
          <View
            style={[styles.amountRow, { borderColor: errorMessage ? ERROR_COLOR : borderColor }]}>
            <ThemedText style={styles.yen}>¥</ThemedText>
            <TextInput
              value={amountText}
              onChangeText={(text) => {
                setAmountText(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="30000"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              style={[styles.amountInput, { color: textColor }]}
            />
          </View>
          {errorMessage && <ThemedText style={styles.fieldError}>⚠️ {errorMessage}</ThemedText>}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: tint, opacity: submitting || pressed ? 0.7 : 1 },
          ]}>
          <ThemedText style={styles.submitLabel}>{submitting ? '保存中…' : '予算を保存'}</ThemedText>
        </Pressable>
      </View>
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
  description: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 20,
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
  fieldError: {
    color: ERROR_COLOR,
    fontSize: 13,
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
