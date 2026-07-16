import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** ホーム画面に小さく表示する、プラン画面への導線バナー。 */
export function ProPromoBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      onPress={() => router.push('/plans')}
      style={({ pressed }) => [
        styles.banner,
        { borderColor: colors.tint, backgroundColor: colors.card },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={[styles.text, { color: colors.tint }]}>
        🔓 Proでムダ買い分析を解放
      </ThemedText>
      <ThemedText style={[styles.chevron, { color: colors.tint }]}>›</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
  },
});
