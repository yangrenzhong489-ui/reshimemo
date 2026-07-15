import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-expense" options={{ presentation: 'modal', title: '支出を追加' }} />
        <Stack.Screen name="graph" options={{ title: 'カテゴリ別グラフ' }} />
        <Stack.Screen name="expense/[id]" options={{ title: '支出の詳細' }} />
        <Stack.Screen name="edit-expense" options={{ presentation: 'modal', title: '支出を編集' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
