import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

import { CategoryTotalRow } from '@/components/category-total-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryById } from '@/constants/categories';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getExpenses } from '@/services/expense-storage';
import type { Expense } from '@/types/expense';
import { getCategoryTotals } from '@/utils/expense-summary';

const screenWidth = Dimensions.get('window').width;

export default function GraphScreen() {
  const colorScheme = useColorScheme();
  const labelColor = colorScheme === 'dark' ? '#ECEDEE' : '#11181C';
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

  const categoryTotals = getCategoryTotals(expenses);
  const chartData = categoryTotals.map((item) => {
    const category = getCategoryById(item.categoryId);
    return {
      name: category.label,
      amount: item.total,
      color: category.color,
      legendFontColor: labelColor,
      legendFontSize: 13,
    };
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          カテゴリ別支出
        </ThemedText>
        <ThemedText style={styles.subtitle}>全期間の合計</ThemedText>

        {loaded && chartData.length === 0 && (
          <ThemedText style={styles.empty}>まだ支出データがありません</ThemedText>
        )}

        {chartData.length > 0 && (
          <>
            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="16"
              chartConfig={{
                color: () => labelColor,
                labelColor: () => labelColor,
              }}
            />

            <View style={styles.list}>
              {categoryTotals.map((item) => (
                <CategoryTotalRow
                  key={item.categoryId}
                  categoryId={item.categoryId}
                  amount={item.total}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 4,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 40,
  },
  list: {
    marginTop: 16,
    gap: 2,
  },
});
