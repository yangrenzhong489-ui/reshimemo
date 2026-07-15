import type { Expense } from '@/types/expense';
import { getPreviousYearMonth, todayString } from '@/utils/date';
import { filterByMonth, getCategoryTotals, sumAmount, type CategoryTotal } from '@/utils/expense-summary';

export type MonthlyChangeDirection = 'increase' | 'decrease' | 'same';

export interface TopSpendingDay {
  date: string;
  amount: number;
}

export interface MonthlyReport {
  yearMonth: string;
  monthTotal: number;
  previousMonthTotal: number;
  /** monthTotal - previousMonthTotal */
  difference: number;
  changeDirection: MonthlyChangeDirection;
  categoryRanking: CategoryTotal[];
  topCategory: CategoryTotal | null;
  topSpendingDay: TopSpendingDay | null;
  expenseCount: number;
}

function findTopSpendingDay(expenses: Expense[]): TopSpendingDay | null {
  const totalsByDate = new Map<string, number>();
  for (const expense of expenses) {
    totalsByDate.set(expense.date, (totalsByDate.get(expense.date) ?? 0) + expense.amount);
  }

  let top: TopSpendingDay | null = null;
  for (const [date, amount] of totalsByDate) {
    if (!top || amount > top.amount) {
      top = { date, amount };
    }
  }
  return top;
}

/** 指定した年月（省略時は今月）の支出レポートを作成する。 */
export function buildMonthlyReport(
  expenses: Expense[],
  yearMonth: string = todayString().slice(0, 7)
): MonthlyReport {
  const monthExpenses = filterByMonth(expenses, yearMonth);
  const previousYearMonth = getPreviousYearMonth(yearMonth);
  const previousMonthExpenses = filterByMonth(expenses, previousYearMonth);

  const monthTotal = sumAmount(monthExpenses);
  const previousMonthTotal = sumAmount(previousMonthExpenses);
  const difference = monthTotal - previousMonthTotal;
  const changeDirection: MonthlyChangeDirection =
    difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'same';

  const categoryRanking = getCategoryTotals(monthExpenses);

  return {
    yearMonth,
    monthTotal,
    previousMonthTotal,
    difference,
    changeDirection,
    categoryRanking,
    topCategory: categoryRanking[0] ?? null,
    topSpendingDay: findTopSpendingDay(monthExpenses),
    expenseCount: monthExpenses.length,
  };
}
