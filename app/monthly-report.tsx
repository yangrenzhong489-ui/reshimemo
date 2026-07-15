import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { CategoryTotalRow } from '@/components/category-total-row';
import { EmptyState } from '@/components/empty-state';
import { ScreenContainer } from '@/components/screen-container';
import { SummaryCard } from '@/components/summary-card';
import { ThemedText } from '@/components/themed-text';
import { getCategoryById } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getExpenses } from '@/services/expense-storage';
import type { Expense } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { formatDateLabel } from '@/utils/date';
import { buildMonthlyReport } from '@/utils/monthly-report';

export default function MonthlyReportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getExpenses().then((data) => {
        if (active) {
          setExpenses(data);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const report = buildMonthlyReport(expenses);

  if (loaded && report.expenseCount === 0) {
    return (
      <ScreenContainer edges={['bottom']} style={styles.container}>
        <EmptyState
          title="今月の支出データがありません"
          description="支出を追加すると、ここにレポートが表示されます"
        />
      </ScreenContainer>
    );
  }

  const changeColor =
    report.changeDirection === 'increase'
      ? colors.danger
      : report.changeDirection === 'decrease'
        ? colors.success
        : undefined;
  const changeIcon =
    report.changeDirection === 'increase' ? '▲' : report.changeDirection === 'decrease' ? '▼' : 'ー';
  const changeLabel =
    report.changeDirection === 'increase'
      ? `前月より ${formatYen(Math.abs(report.difference))} 増えました`
      : report.changeDirection === 'decrease'
        ? `前月より ${formatYen(Math.abs(report.difference))} 減りました`
        : '前月と同じです';

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <SummaryCard label="今月の支出" amount={report.monthTotal} />
          <SummaryCard label="前月の支出" amount={report.previousMonthTotal} />
        </View>

        <Card style={changeColor ? { borderColor: changeColor } : undefined}>
          <ThemedText style={[styles.changeText, changeColor ? { color: changeColor } : null]}>
            {changeIcon} {changeLabel}
          </ThemedText>
        </Card>

        <View style={styles.statRow}>
          <View style={styles.statBlock}>
            <ThemedText style={styles.statLabel}>今月の支出件数</ThemedText>
            <ThemedText style={styles.statValue}>{report.expenseCount}件</ThemedText>
          </View>

          {report.topSpendingDay && (
            <View style={styles.statBlock}>
              <ThemedText style={styles.statLabel}>支出が一番多かった日</ThemedText>
              <ThemedText style={styles.statValue}>
                {formatDateLabel(report.topSpendingDay.date)}
              </ThemedText>
              <ThemedText style={styles.statSubValue}>
                {formatYen(report.topSpendingDay.amount)}
              </ThemedText>
            </View>
          )}
        </View>

        {report.topCategory && (
          <View style={styles.topCategoryCard}>
            <ThemedText style={styles.sectionTitle}>一番使ったカテゴリ</ThemedText>
            <View style={styles.topCategoryRow}>
              <ThemedText style={styles.topCategoryEmoji}>
                {getCategoryById(report.topCategory.categoryId).emoji}
              </ThemedText>
              <ThemedText style={styles.topCategoryLabel}>
                {getCategoryById(report.topCategory.categoryId).label}
              </ThemedText>
              <ThemedText style={styles.topCategoryAmount}>
                {formatYen(report.topCategory.total)}
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>カテゴリ別ランキング</ThemedText>
          {report.categoryRanking.map((item, index) => (
            <View key={item.categoryId} style={styles.rankRow}>
              <ThemedText style={styles.rankNumber}>{index + 1}位</ThemedText>
              <View style={styles.rankItem}>
                <CategoryTotalRow categoryId={item.categoryId} amount={item.total} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  changeText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBlock: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statSubValue: {
    fontSize: 13,
    opacity: 0.7,
  },
  topCategoryCard: {
    gap: 8,
  },
  topCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topCategoryEmoji: {
    fontSize: 28,
  },
  topCategoryLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  topCategoryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.7,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    width: 32,
  },
  rankItem: {
    flex: 1,
  },
});
