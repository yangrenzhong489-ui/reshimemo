import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatYen } from '@/utils/currency';
import { getBudgetStatus } from '@/utils/budget';

const STATUS_COLORS = {
  normal: '#4CAF50',
  caution: '#F5A623',
  over: '#e0245e',
} as const;

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
  const tint = Colors[colorScheme ?? 'light'].tint;
  const trackColor = colorScheme === 'dark' ? '#2c2f30' : '#e9ecef';

  if (budget === null) {
    return (
      <Pressable
        onPress={() => router.push('/set-budget')}
        style={({ pressed }) => [
          styles.emptyCard,
          { borderColor: tint, opacity: pressed ? 0.6 : 1 },
        ]}>
        <ThemedText style={[styles.emptyLabel, { color: tint }]}>＋ 今月の予算を設定する</ThemedText>
      </Pressable>
    );
  }

  const status = getBudgetStatus(spent, budget);
  const percentage = Math.round((spent / budget) * 100);
  const barWidth = Math.min(percentage, 100);
  const statusColor = STATUS_COLORS[status];
  const message = STATUS_MESSAGES[status];

  return (
    <Pressable
      onPress={() => router.push('/set-budget')}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.label}>今月の予算</ThemedText>
        <ThemedText style={[styles.percentage, { color: statusColor }]}>{percentage}%</ThemedText>
      </View>

      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: statusColor }]} />
      </View>

      <ThemedText style={styles.amountText}>
        {formatYen(spent)} / {formatYen(budget)}
      </ThemedText>

      {message && <ThemedText style={[styles.message, { color: statusColor }]}>{message}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
  },
  cardPressed: {
    opacity: 0.7,
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
  },
  emptyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
