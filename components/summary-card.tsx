import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { formatYen } from '@/utils/currency';

type SummaryCardProps = {
  label: string;
  amount: number;
};

export function SummaryCard({ label, amount }: SummaryCardProps) {
  return (
    <Card variant="filled" style={styles.card}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.amount}>{formatYen(amount)}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
  },
});
