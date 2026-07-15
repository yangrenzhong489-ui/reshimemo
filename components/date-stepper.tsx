import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addDays, formatDateLabel, todayString } from '@/utils/date';

type DateStepperProps = {
  value: string;
  onChange: (next: string) => void;
};

export function DateStepper({ value, onChange }: DateStepperProps) {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const isToday = value === todayString();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => onChange(addDays(value, -1))} style={styles.stepButton} hitSlop={8}>
        <ThemedText style={[styles.stepButtonText, { color: tint }]}>◀</ThemedText>
      </Pressable>

      <View style={styles.labelContainer}>
        <ThemedText style={styles.label}>{formatDateLabel(value)}</ThemedText>
        {!isToday && (
          <Pressable onPress={() => onChange(todayString())} hitSlop={8}>
            <ThemedText style={[styles.todayLink, { color: tint }]}>今日に戻す</ThemedText>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => onChange(addDays(value, 1))} style={styles.stepButton} hitSlop={8}>
        <ThemedText style={[styles.stepButtonText, { color: tint }]}>▶</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stepButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  labelContainer: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayLink: {
    fontSize: 12,
  },
});
