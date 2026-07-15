import type { CategoryId, Expense } from '@/types/expense';
import { todayString } from '@/utils/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateString: string): boolean {
  return DATE_PATTERN.test(dateString);
}

function toYearMonth(dateString: string): string {
  return dateString.slice(0, 7);
}

/** 日付が'YYYY-MM-DD'形式として正しい支出だけを残す。 */
function withValidDate(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isValidDate(expense.date));
}

/** 支出の金額を合計する。 */
export function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/** 支出日が新しい順に並び替える（同日はcreatedAtが新しい順）。 */
export function sortByDateDesc(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/** 指定した年月（'YYYY-MM'）の支出だけを残す。日付が不正な支出は除外する。 */
export function filterByMonth(expenses: Expense[], yearMonth: string): Expense[] {
  return withValidDate(expenses).filter((expense) => toYearMonth(expense.date) === yearMonth);
}

/** 指定した日付の支出合計を返す。dateを省略すると実行時点の今日を使う。 */
export function getTodayTotal(expenses: Expense[], date: string = todayString()): number {
  const target = isValidDate(date) ? date : todayString();
  return sumAmount(withValidDate(expenses).filter((expense) => expense.date === target));
}

/** 指定した年月の支出合計を返す。yearMonthを省略すると実行時点の今月（'YYYY-MM'）を使う。 */
export function getMonthlyTotal(
  expenses: Expense[],
  yearMonth: string = toYearMonth(todayString())
): number {
  return sumAmount(filterByMonth(expenses, yearMonth));
}

export interface CategoryTotal {
  categoryId: CategoryId;
  total: number;
}

/** カテゴリごとの支出合計を、金額が大きい順に返す。 */
export function getCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<CategoryId, number>();

  for (const expense of withValidDate(expenses)) {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amount);
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

/** 支出を新しい順に並べて返す。limitを指定するとその件数だけに絞る。 */
export function getRecentExpenses(expenses: Expense[], limit?: number): Expense[] {
  const sorted = sortByDateDesc(withValidDate(expenses));
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}
