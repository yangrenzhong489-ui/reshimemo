import { getCategoryById } from '@/constants/categories';
import type { CategoryId, Expense } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { addDays, getPreviousYearMonth, getWeekRange, todayString } from '@/utils/date';
import { filterByMonth, getCategoryTotals, sumAmount } from '@/utils/expense-summary';

export type MissionType =
  | 'category-week-cap'
  | 'store-week-cap'
  | 'category-month-reduction'
  | 'logging-streak';

export type MissionStatus = 'in_progress' | 'achieved' | 'failed';

/** その期間の支出データから自動生成される、節約ミッションの定義（ローカル保存の対象）。 */
export interface MissionDefinition {
  id: string;
  type: MissionType;
  title: string;
  periodLabel: '今週' | '今月';
  periodStart: string;
  periodEnd: string;
  targetAmount?: number;
  targetDays?: number;
  categoryId?: CategoryId;
  storeName?: string;
  /** 比較対象（先週・先月）の実績。達成時の「〇〇円節約できました」表示に使う。 */
  previousAmount?: number;
}

/** ミッション定義に、現在の支出データから計算した達成状況を加えたもの。 */
export interface MissionProgress extends MissionDefinition {
  status: MissionStatus;
  currentAmount?: number;
  currentDays?: number;
}

const MIN_MISSION_BASE_AMOUNT = 500;
const WEEK_CAP_RATIO = 0.8;
const STREAK_TARGET_DAYS = 3;
const PERCENTAGE_REDUCTION_THRESHOLD = 3000;
const FIXED_REDUCTION_AMOUNT = 500;
const MAX_MISSIONS = 3;

function roundToNiceAmount(amount: number): number {
  return Math.max(100, Math.round(amount / 100) * 100);
}

function filterByDateRange(expenses: Expense[], start: string, end: string): Expense[] {
  return expenses.filter((expense) => expense.date >= start && expense.date <= end);
}

function buildStoreTotals(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const storeName = expense.memo?.trim();
    if (!storeName) continue;
    totals.set(storeName, (totals.get(storeName) ?? 0) + expense.amount);
  }
  return totals;
}

/** 今日から遡って何日連続で支出が記録されているかを数える。 */
function countLoggingStreak(expenses: Expense[], today: string): number {
  const daysWithExpense = new Set(expenses.map((expense) => expense.date));
  let streak = 0;
  let cursor = today;
  while (daysWithExpense.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * 保存済みの支出データから、今週・今月の節約ミッションをルールベースで自動生成する。
 * AI APIは使わず、直近の実績（先週・先月の支出）を基準に目標値を決める。
 */
export function generateMissions(
  expenses: Expense[],
  today: string = todayString()
): MissionDefinition[] {
  const missions: MissionDefinition[] = [];
  const { start: weekStart, end: weekEnd } = getWeekRange(today);
  const previousWeekEnd = addDays(weekStart, -1);
  const previousWeekStart = addDays(weekStart, -7);
  const previousWeekExpenses = filterByDateRange(expenses, previousWeekStart, previousWeekEnd);

  // 1. カテゴリ別の週間ミッション：先週最も使ったカテゴリに上限を設定する。
  const previousWeekCategoryTotals = getCategoryTotals(previousWeekExpenses);
  const topWeekCategory = previousWeekCategoryTotals[0];
  if (topWeekCategory && topWeekCategory.total >= MIN_MISSION_BASE_AMOUNT) {
    const targetAmount = roundToNiceAmount(topWeekCategory.total * WEEK_CAP_RATIO);
    const label = getCategoryById(topWeekCategory.categoryId).label;
    missions.push({
      id: `category-week-cap:${weekStart}:${topWeekCategory.categoryId}`,
      type: 'category-week-cap',
      title: `${label}を${formatYen(targetAmount)}以内にしよう`,
      periodLabel: '今週',
      periodStart: weekStart,
      periodEnd: weekEnd,
      targetAmount,
      categoryId: topWeekCategory.categoryId,
      previousAmount: topWeekCategory.total,
    });
  }

  // 2. 店名（メモ）別の週間ミッション：先週最も使ったお店に上限を設定する。
  const previousWeekStoreTotals = buildStoreTotals(previousWeekExpenses);
  const topWeekStore = Array.from(previousWeekStoreTotals.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topWeekStore && topWeekStore[1] >= MIN_MISSION_BASE_AMOUNT) {
    const [storeName, previousAmount] = topWeekStore;
    const targetAmount = roundToNiceAmount(previousAmount * WEEK_CAP_RATIO);
    missions.push({
      id: `store-week-cap:${weekStart}:${storeName}`,
      type: 'store-week-cap',
      title: `${storeName}での支出を${formatYen(targetAmount)}以内にしよう`,
      periodLabel: '今週',
      periodStart: weekStart,
      periodEnd: weekEnd,
      targetAmount,
      storeName,
      previousAmount,
    });
  }

  // 3. カテゴリ別の月間削減ミッション：先月最も使ったカテゴリを今月は減らす。
  const yearMonth = today.slice(0, 7);
  const previousYearMonth = getPreviousYearMonth(yearMonth);
  const previousMonthCategoryTotals = getCategoryTotals(filterByMonth(expenses, previousYearMonth));
  const topMonthCategory = previousMonthCategoryTotals[0];
  if (topMonthCategory && topMonthCategory.total >= MIN_MISSION_BASE_AMOUNT) {
    const usePercentage = topMonthCategory.total >= PERCENTAGE_REDUCTION_THRESHOLD;
    const reductionAmount = usePercentage
      ? roundToNiceAmount(topMonthCategory.total * 0.1)
      : FIXED_REDUCTION_AMOUNT;
    const targetAmount = Math.max(0, topMonthCategory.total - reductionAmount);
    const label = getCategoryById(topMonthCategory.categoryId).label;
    const reductionText = usePercentage ? '10%' : formatYen(FIXED_REDUCTION_AMOUNT);

    missions.push({
      id: `category-month-reduction:${yearMonth}:${topMonthCategory.categoryId}`,
      type: 'category-month-reduction',
      title: `${label}を先月より${reductionText}減らそう`,
      periodLabel: '今月',
      periodStart: `${yearMonth}-01`,
      periodEnd: `${yearMonth}-31`,
      targetAmount,
      categoryId: topMonthCategory.categoryId,
      previousAmount: topMonthCategory.total,
    });
  }

  // 4. 連続記録ミッション：達成済みでなければ常に候補にする（挑戦のハードルが低いミッション）。
  const currentStreak = countLoggingStreak(expenses, today);
  if (currentStreak < STREAK_TARGET_DAYS) {
    missions.push({
      id: `logging-streak:${weekStart}`,
      type: 'logging-streak',
      title: `${STREAK_TARGET_DAYS}日連続で支出を記録しよう`,
      periodLabel: '今週',
      periodStart: weekStart,
      periodEnd: weekEnd,
      targetDays: STREAK_TARGET_DAYS,
    });
  }

  return missions.slice(0, MAX_MISSIONS);
}

/** ミッション定義と現在の支出データから、達成状況を計算する。 */
export function evaluateMission(
  mission: MissionDefinition,
  expenses: Expense[],
  today: string = todayString()
): MissionProgress {
  if (mission.type === 'logging-streak') {
    const currentDays = countLoggingStreak(expenses, today);
    const status: MissionStatus = currentDays >= (mission.targetDays ?? 0) ? 'achieved' : 'in_progress';
    return { ...mission, status, currentDays };
  }

  const periodExpenses = filterByDateRange(expenses, mission.periodStart, mission.periodEnd);
  const currentAmount =
    mission.type === 'store-week-cap'
      ? sumAmount(periodExpenses.filter((expense) => expense.memo?.trim() === mission.storeName))
      : sumAmount(periodExpenses.filter((expense) => expense.categoryId === mission.categoryId));

  const targetAmount = mission.targetAmount ?? 0;
  const periodEnded = today > mission.periodEnd;
  const withinTarget = currentAmount <= targetAmount;
  const status: MissionStatus = withinTarget ? (periodEnded ? 'achieved' : 'in_progress') : 'failed';

  return { ...mission, status, currentAmount };
}
