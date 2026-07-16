import { getCategoryById } from '@/constants/categories';
import type { CategoryId, Expense } from '@/types/expense';
import { todayString } from '@/utils/date';
import { filterByMonth } from '@/utils/expense-summary';

/** 分析を行うために必要な、今月の最低支出件数。 */
const MIN_EXPENSE_COUNT = 10;
/** 店舗ランキングに含めるために必要な、その店舗での最低記録件数。 */
const MIN_STORE_RECORD_COUNT = 2;
const TOP_CATEGORY_COUNT = 3;
const TOP_STORE_COUNT = 3;

export interface CategoryFrequency {
  categoryId: CategoryId;
  label: string;
  emoji: string;
  count: number;
  total: number;
}

export interface StoreFrequency {
  storeName: string;
  count: number;
  total: number;
}

export interface PurchaseFrequencyResult {
  yearMonth: string;
  /** 分析に十分な件数の支出が今月に記録されているか。 */
  hasEnoughData: boolean;
  topCategories: CategoryFrequency[];
  topStores: StoreFrequency[];
}

/** カテゴリごとの購入回数・合計金額を、回数が多い順に返す。 */
function findTopCategories(expenses: Expense[]): CategoryFrequency[] {
  const groups = new Map<CategoryId, { count: number; total: number }>();
  for (const expense of expenses) {
    const current = groups.get(expense.categoryId) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += expense.amount;
    groups.set(expense.categoryId, current);
  }

  return Array.from(groups.entries())
    .map(([categoryId, { count, total }]) => {
      const category = getCategoryById(categoryId);
      return { categoryId, label: category.label, emoji: category.emoji, count, total };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_CATEGORY_COUNT);
}

/** 店名（メモ欄）ごとの購入回数・合計金額を、回数が多い順に返す。 */
function findTopStores(expenses: Expense[]): StoreFrequency[] {
  const groups = new Map<string, { count: number; total: number }>();
  for (const expense of expenses) {
    const storeName = expense.memo?.trim();
    if (!storeName) continue;
    const current = groups.get(storeName) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += expense.amount;
    groups.set(storeName, current);
  }

  return Array.from(groups.entries())
    .filter(([, { count }]) => count >= MIN_STORE_RECORD_COUNT)
    .map(([storeName, { count, total }]) => ({ storeName, count, total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_STORE_COUNT);
}

/**
 * 保存済みの支出データから、今月「よく買っているもの」をカテゴリ別・店名別の購入回数でランキングする。
 * 金額ではなく回数を基準にすることで、支出額のランキングとは違う「買い物のクセ」を見せる。
 */
export function analyzePurchaseFrequency(
  expenses: Expense[],
  yearMonth: string = todayString().slice(0, 7)
): PurchaseFrequencyResult {
  const monthExpenses = filterByMonth(expenses, yearMonth);
  const hasEnoughData = monthExpenses.length >= MIN_EXPENSE_COUNT;

  if (!hasEnoughData) {
    return { yearMonth, hasEnoughData, topCategories: [], topStores: [] };
  }

  return {
    yearMonth,
    hasEnoughData,
    topCategories: findTopCategories(monthExpenses),
    topStores: findTopStores(monthExpenses),
  };
}
