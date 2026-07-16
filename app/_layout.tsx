import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme}>
        <Stack>
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
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
