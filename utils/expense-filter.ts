import { getCategoryById } from '@/constants/categories';
import type { CategoryId, Expense } from '@/types/expense';
import { getPreviousYearMonth, todayString } from '@/utils/date';
import { filterByMonth, sortByDateDesc } from '@/utils/expense-summary';

export type PeriodFilter = 'thisMonth' | 'lastMonth' | 'all';
export type SortOrder = 'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc';

export interface ExpenseFilterOptions {
  searchText?: string;
  categoryId?: CategoryId | null;
  period?: PeriodFilter;
  sortOrder?: SortOrder;
}

function matchesSearch(expense: Expense, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const categoryLabel = getCategoryById(expense.categoryId).label;
  const haystack = [expense.memo, expense.ocrText, categoryLabel]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function sortExpenses(expenses: Expense[], order: SortOrder): Expense[] {
  switch (order) {
    case 'dateDesc':
      return sortByDateDesc(expenses);
    case 'dateAsc':
      return [...sortByDateDesc(expenses)].reverse();
    case 'amountDesc':
      return [...expenses].sort((a, b) => b.amount - a.amount);
    case 'amountAsc':
      return [...expenses].sort((a, b) => a.amount - b.amount);
    default:
      return expenses;
  }
}

/** 検索テキスト・カテゴリ・期間で絞り込み、指定の順序で並び替えた支出一覧を返す。 */
export function filterAndSortExpenses(
  expenses: Expense[],
  options: ExpenseFilterOptions = {}
): Expense[] {
  const { searchText = '', categoryId = null, period = 'all', sortOrder = 'dateDesc' } = options;

  let result = expenses;

  if (period === 'thisMonth') {
    result = filterByMonth(result, todayString().slice(0, 7));
  } else if (period === 'lastMonth') {
    result = filterByMonth(result, getPreviousYearMonth(todayString().slice(0, 7)));
  }

  if (categoryId) {
    result = result.filter((expense) => expense.categoryId === categoryId);
  }

  if (searchText.trim()) {
    result = result.filter((expense) => matchesSearch(expense, searchText));
  }

  return sortExpenses(result, sortOrder);
}
