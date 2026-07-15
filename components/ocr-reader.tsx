import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { recognizeTextFromImage } from '@/services/ocr-service';

const ERROR_MESSAGES = {
  'no-api-key': 'OCR機能の設定が完了していません（APIキー未設定）。',
  'network-error': '通信エラーが発生しました。電波状況を確認してもう一度お試しください。',
  'api-error': '文字の読み取りに失敗しました。もう一度お試しください。',
} as const;

/** 画面が崩れないよう、読み取り結果はこの文字数までに丸める。 */
const OCR_TEXT_MAX_LENGTH = 5000;

type OcrReaderProps = {
  photoUri: string | null;
  value: string | null;
  onChange: (text: string | null) => void;
};

export function OcrReader({ photoUri, value, onChange }: OcrReaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tint = colors.tint;
  const borderColor = colors.border;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePress = async () => {
    if (!photoUri || loading) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await recognizeTextFromImage(photoUri);

      if (result.success) {
        onChange(result.text.slice(0, OCR_TEXT_MAX_LENGTH));
        return;
      }

      if (result.reason === 'no-text') {
        onChange(null);
        setErrorMessage('文字を読み取れませんでした');
        return;
      }

      setErrorMessage(ERROR_MESSAGES[result.reason]);
    } finally {
      setLoading(false);
    }
  };

  const disabled = !photoUri || loading;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          { borderColor: tint, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        ]}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={tint} />
            <ThemedText style={[styles.buttonLabel, { color: tint }]}>読み取り中…</ThemedText>
          </View>
        ) : (
          <ThemedText style={[styles.buttonLabel, { color: tint }]}>
            🔍 レシートの文字を読み取る
          </ThemedText>
        )}
      </Pressable>

      {errorMessage && (
        <ThemedText style={[styles.errorText, { color: colors.danger }]}>⚠️ {errorMessage}</ThemedText>
      )}

      {value && (
        <View style={[styles.resultBlock, { borderColor }]}>
          <ThemedText style={styles.resultLabel}>読み取ったテキスト</ThemedText>
          <ScrollView style={styles.resultScroll} nestedScrollEnabled>
            <ThemedText style={styles.resultText}>{value}</ThemedText>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  button: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
  },
  resultBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  resultScroll: {
    maxHeight: 160,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
