import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBudget, setBudget } from '@/services/budget-storage';

export default function SetBudgetScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const textColor = useThemeColor({}, 'text');

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
            style={[
              styles.amountRow,
              { borderColor: errorMessage ? colors.danger : colors.border },
            ]}>
            <ThemedText style={[styles.yen, { color: colors.tint }]}>¥</ThemedText>
            <TextInput
              value={amountText}
              onChangeText={(text) => {
                setAmountText(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="30000"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              style={[styles.amountInput, { color: textColor }]}
            />
          </View>
          {errorMessage && (
            <ThemedText style={[styles.fieldError, { color: colors.danger }]}>
              ⚠️ {errorMessage}
            </ThemedText>
          )}
        </View>

        <AppButton
          label={submitting ? '保存中…' : '予算を保存'}
          onPress={handleSubmit}
          disabled={submitting}
          loading={submitting}
        />
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
  fieldError: {
    fontSize: 13,
  },
});
