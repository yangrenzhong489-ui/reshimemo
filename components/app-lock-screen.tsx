import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authenticateWithBiometrics } from '@/services/app-lock-service';

type AppLockScreenProps = {
  onUnlock: () => void;
};

const PROMPT_MESSAGE = 'レシメモのロックを解除';

/** アプリロックが有効なときに表示する全画面ロック。生体認証で解除し、失敗時は再試行できる。 */
export function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [authenticating, setAuthenticating] = useState(false);
  const [failed, setFailed] = useState(false);

  const tryAuthenticate = useCallback(async () => {
    setAuthenticating(true);
    setFailed(false);
    const success = await authenticateWithBiometrics(PROMPT_MESSAGE);
    setAuthenticating(false);
    if (success) {
      onUnlock();
    } else {
      setFailed(true);
    }
  }, [onUnlock]);

  useEffect(() => {
    tryAuthenticate();
    // 初回表示時に一度だけ自動で認証を求める。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.icon}>🔒</ThemedText>
        <ThemedText style={styles.title}>レシメモはロックされています</ThemedText>
        <ThemedText style={styles.description}>
          生体認証（Face ID / Touch ID / 指紋認証）で解除してください。
        </ThemedText>

        {failed && (
          <ThemedText style={[styles.errorText, { color: colors.danger }]}>
            認証に失敗しました。もう一度お試しください。
          </ThemedText>
        )}

        <AppButton
          label={authenticating ? '認証中…' : '🔓 生体認証で解除'}
          onPress={tryAuthenticate}
          loading={authenticating}
          disabled={authenticating}
          style={styles.button}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
