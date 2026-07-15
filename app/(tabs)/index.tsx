import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CategoryTotalRow } from '@/components/category-total-row';
import { ExpenseListItem } from '@/components/expense-list-item';
import { ScreenContainer } from '@/components/screen-container';
import { SummaryCard } from '@/components/summary-card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getExpenses } from '@/services/expense-storage';
import type { Expense } from '@/types/expense';
import { todayString } from '@/utils/date';
import {
  filterByMonth,
  getCategoryTotals,
  getMonthlyTotal,
  getRecentExpenses,
  getTodayTotal,
} from '@/utils/expense-summary';

const RECENT_COUNT = 10;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;
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

  const thisMonth = todayString().slice(0, 7);

  const todayTotal = getTodayTotal(expenses);
  const monthTotal = getMonthlyTotal(expenses);
  const categoryTotals = getCategoryTotals(filterByMonth(expenses, thisMonth)).slice(0, 5);
  const recent = getRecentExpenses(expenses, RECENT_COUNT);

  return (
    <ScreenContainer edges={['top']} style={styles.container}>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/expense/[id]', params: { id: item.id } })}
            style={({ pressed }) => pressed && styles.pressed}>
            <ExpenseListItem expense={item} />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.title}>
                レシメモ
              </ThemedText>
              <Pressable
                onPress={() => router.push('/graph')}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText style={[styles.graphLink, { color: tint }]}>📊 グラフ</ThemedText>
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <SummaryCard label="今月の支出" amount={monthTotal} />
              <SummaryCard label="今日の支出" amount={todayTotal} />
            </View>

            {categoryTotals.length > 0 && (
              <View style={styles.categorySection}>
                <ThemedText style={styles.sectionTitle}>カテゴリ別（今月）</ThemedText>
                {categoryTotals.map((item) => (
                  <CategoryTotalRow
                    key={item.categoryId}
                    categoryId={item.categoryId}
                    amount={item.total}
                  />
                ))}
              </View>
            )}

            <ThemedText style={styles.sectionTitle}>最近の支出</ThemedText>
          </View>
        }
        ListEmptyComponent={
          loaded ? <ThemedText style={styles.empty}>まだ支出がありません</ThemedText> : null
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: tint, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push('/add-expense')}>
        <ThemedText style={styles.addButtonLabel}>＋ 支出を追加</ThemedText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  header: {
    gap: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
  },
  graphLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categorySection: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 24,
  },
  addButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
