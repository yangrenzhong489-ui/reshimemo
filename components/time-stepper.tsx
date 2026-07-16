import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TimeStepperProps = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
};

const STEP_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

function addMinutes(hour: number, minute: number, delta: number): { hour: number; minute: number } {
  const total = ((hour * 60 + minute + delta) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function TimeStepper({ hour, minute, onChange }: TimeStepperProps) {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;

  const step = (delta: number) => {
    const next = addMinutes(hour, minute, delta);
    onChange(next.hour, next.minute);
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={() => step(-STEP_MINUTES)} style={styles.stepButton} hitSlop={8}>
        <ThemedText style={[styles.stepButtonText, { color: tint }]}>◀</ThemedText>
      </Pressable>

      <ThemedText style={styles.label}>{formatTime(hour, minute)}</ThemedText>

      <Pressable onPress={() => step(STEP_MINUTES)} style={styles.stepButton} hitSlop={8}>
        <ThemedText style={[styles.stepButtonText, { color: tint }]}>▶</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
});
