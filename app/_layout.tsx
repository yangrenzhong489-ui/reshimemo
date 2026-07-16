import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, type AppStateStatus } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockScreen } from '@/components/app-lock-screen';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getBiometricAvailability } from '@/services/app-lock-service';
import { getAppLockSettings } from '@/services/app-lock-settings-storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [checkingLock, setCheckingLock] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const runLockCheck = useCallback(async () => {
    const settings = await getAppLockSettings();
    if (!settings.enabled) {
      setIsLocked(false);
      setCheckingLock(false);
      return;
    }

    const availability = await getBiometricAvailability();
    // 生体認証が使えない場合はロックせず通す（設定画面のトグルON時点で案内済み）。
    setIsLocked(availability.available);
    setCheckingLock(false);
  }, []);

  useEffect(() => {
    runLockCheck();
  }, [runLockCheck]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        runLockCheck();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [runLockCheck]);

  if (checkingLock) {
    return (
      <SafeAreaProvider>
        <ThemedView style={styles.blank} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme}>
        {isLocked ? (
          <AppLockScreen onUnlock={() => setIsLocked(false)} />
        ) : (
          <Stack screenOptions={{ headerBackTitle: '戻る' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-expense" options={{ presentation: 'modal', title: '支出を追加' }} />
            <Stack.Screen name="graph" options={{ title: 'カテゴリ別グラフ' }} />
            <Stack.Screen name="expense/[id]" options={{ title: '支出の詳細' }} />
            <Stack.Screen name="edit-expense" options={{ presentation: 'modal', title: '支出を編集' }} />
            <Stack.Screen name="set-budget" options={{ presentation: 'modal', title: '予算を設定' }} />
            <Stack.Screen name="expense-list" options={{ title: '支出を検索' }} />
            <Stack.Screen name="monthly-report" options={{ title: '月別レポート' }} />
            <Stack.Screen name="settings" options={{ title: '設定' }} />
            <Stack.Screen name="plans" options={{ title: 'プラン' }} />
          </Stack>
        )}
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
  },
});
