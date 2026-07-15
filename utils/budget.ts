export type BudgetStatus = 'normal' | 'caution' | 'over';

const CAUTION_THRESHOLD = 0.8;
const OVER_THRESHOLD = 1;

/** 今月の支出が予算に対してどの状態か判定する。budgetが0以下の場合は常にnormal。 */
export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) return 'normal';

  const ratio = spent / budget;
  if (ratio >= OVER_THRESHOLD) return 'over';
  if (ratio >= CAUTION_THRESHOLD) return 'caution';
  return 'normal';
}
