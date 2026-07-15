import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { CategoryFilterChips } from '@/components/category-filter-chips';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { ScreenContainer } from '@/components/screen-container';
import { SegmentedFilter, type SegmentOption } from '@/components/segmented-filter';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getExpenses } from '@/services/expense-storage';
import type { CategoryId, Expense } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { filterAndSortExpenses, type PeriodFilter, type SortOrder } from '@/utils/expense-filter';
import { sumAmount } from '@/utils/expense-summary';

const PERIOD_OPTIONS: SegmentOption<PeriodFilter>[] = [
  { value: 'thisMonth', label: '今月' },
  { value: 'lastMonth', label: '先月' },
  { value: 'all', label: '全期間' },
];

const SORT_OPTIONS: SegmentOption<SortOrder>[] = [
  { value: 'dateDesc', label: '新しい順' },
  { value: 'dateAsc', label: '古い順' },
  { value: 'amountDesc', label: '金額が高い順' },
  { value: 'amountAsc', label: '金額が低い順' },
];

const DEFAULT_PERIOD: PeriodFilter = 'all';
const DEFAULT_SORT: SortOrder = 'dateDesc';

export default function ExpenseListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const textColor = useThemeColor({}, 'text');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>(DEFAULT_PERIOD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT);

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

  const filtered = useMemo(
    () => filterAndSortExpenses(expenses, { searchText, categoryId, period, sortOrder }),
    [expenses, searchText, categoryId, period, sortOrder]
  );

  const totalAmount = sumAmount(filtered);

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    categoryId !== null ||
    period !== DEFAULT_PERIOD ||
    sortOrder !== DEFAULT_SORT;

  const handleReset = () => {
    setSearchText('');
    setCategoryId(null);
    setPeriod(DEFAULT_PERIOD);
    setSortOrder(DEFAULT_SORT);
  };

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <FlatList
        data={filtered}
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
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="店名・メモ・カテゴリで検索"
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { borderColor: colors.border, color: textColor }]}
            />

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>カテゴリ</ThemedText>
              <CategoryFilterChips selectedId={categoryId} onSelect={setCategoryId} />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>期間</ThemedText>
              <SegmentedFilter options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>並び替え</ThemedText>
              <SegmentedFilter options={SORT_OPTIONS} value={sortOrder} onChange={setSortOrder} />
            </View>

            {hasActiveFilters && (
              <AppButton label="フィルターを解除" onPress={handleReset} variant="primaryOutline" />
            )}

            <View style={[styles.summary, { borderColor: colors.border }]}>
              <ThemedText style={styles.summaryText}>
                {filtered.length}件 ・ 合計 {formatYen(totalAmount)}
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          loaded ? (
            <EmptyState
              title="該当する支出がありません"
              description="検索条件やフィルターを変更してみてください"
            />
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    gap: 16,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.6,
  },
  summary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
