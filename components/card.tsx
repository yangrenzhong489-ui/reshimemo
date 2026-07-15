import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CardProps = PropsWithChildren<{
  /** 'filled' はtint色を薄く敷いた背景、'outline' は枠線のみ。 */
  variant?: 'filled' | 'outline';
  style?: StyleProp<ViewStyle>;
}>;

/** アプリ共通のカード枠。角丸・余白・枠線/背景をここで統一する。 */
export function Card({ children, variant = 'outline', style }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.base,
        variant === 'filled'
          ? { backgroundColor: colors.card }
          : { borderWidth: 1, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
  },
});
