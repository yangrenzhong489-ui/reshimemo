import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatYen } from '@/utils/currency';

type SummaryCardProps = {
  label: string;
  amount: number;
};

export function SummaryCard({ label, amount }: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.amount}>{formatYen(amount)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
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
    fontSize: 22,
    fontWeight: '700',
  },
});
