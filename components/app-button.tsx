import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type AppButtonVariant = 'primary' | 'primaryOutline' | 'danger' | 'dangerOutline';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** アプリ共通のボタン。通常操作はprimary系（青緑）、危険な操作はdanger系（赤）で統一する。 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isInactive = disabled || loading;

  const tone = variant.startsWith('danger') ? colors.danger : colors.tint;
  const isOutline = variant === 'primaryOutline' || variant === 'dangerOutline';

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        isOutline
          ? { borderWidth: 1.5, borderColor: tone, backgroundColor: 'transparent' }
          : { backgroundColor: tone },
        (pressed || isInactive) && { opacity: 0.7 },
        style,
      ]}>
      <View style={styles.content}>
        {loading && <ActivityIndicator color={isOutline ? tone : '#fff'} />}
        <ThemedText style={[styles.label, { color: isOutline ? tone : '#fff' }]}>{label}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
