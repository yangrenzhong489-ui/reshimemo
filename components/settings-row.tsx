import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

type SettingsRowProps = {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
};

export function SettingsRow({ icon, label, onPress, disabled, loading, destructive }: SettingsRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const textColor = useThemeColor({}, 'text');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.border },
        (pressed || disabled || loading) && styles.pressed,
      ]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={[styles.label, { color: destructive ? colors.danger : textColor }]}>
        {label}
      </ThemedText>
      {loading ? (
        <ActivityIndicator color={colors.placeholder} />
      ) : (
        <ThemedText style={[styles.chevron, { color: colors.placeholder }]}>›</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
  },
});
