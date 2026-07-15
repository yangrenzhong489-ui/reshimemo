import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getBudgetStatus } from '@/utils/budget';
import { formatYen } from '@/utils/currency';

const STATUS_MESSAGES = {
  normal: null,
  caution: '⚠️ 予算の80%を超えています',
  over: '🚨 予算を超えています',
} as const;

type BudgetProgressProps = {
  budget: number | null;
  spent: number;
};

export function BudgetProgress({ budget, spent }: BudgetProgressProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (budget === null) {
    return (
      <Pressable
        onPress={() => router.push('/set-budget')}
        style={({ pressed }) => [
          styles.emptyCard,
          { borderColor: colors.tint, opacity: pressed ? 0.6 : 1 },
        ]}>
        <ThemedText style={styles.emptyStatus}>予算が未設定です</ThemedText>
        <ThemedText style={[styles.emptyLabel, { color: colors.tint }]}>
          ＋ 今月の予算を設定する
        </ThemedText>
      </Pressable>
    );
  }

  const status = getBudgetStatus(spent, budget);
  const percentage = Math.round((spent / budget) * 100);
  const barWidth = Math.min(percentage, 100);
  const statusColor =
    status === 'over' ? colors.danger : status === 'caution' ? colors.warning : colors.success;
  const message = STATUS_MESSAGES[status];

  return (
    <Pressable onPress={() => router.push('/set-budget')} style={({ pressed }) => pressed && styles.pressed}>
      <Card variant="filled" style={styles.card}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.label}>今月の予算</ThemedText>
          <ThemedText style={[styles.percentage, { color: statusColor }]}>{percentage}%</ThemedText>
        </View>

        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: statusColor }]} />
        </View>

        <ThemedText style={styles.amountText}>
          {formatYen(spent)} / {formatYen(budget)}
        </ThemedText>

        {message && (
          <ThemedText style={[styles.message, { color: statusColor }]}>{message}</ThemedText>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyStatus: {
    fontSize: 13,
    opacity: 0.6,
  },
  emptyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
