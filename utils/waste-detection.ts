import { getCategoryById } from '@/constants/categories';
import type { CategoryId, Expense } from '@/types/expense';
import { formatYen } from '@/utils/currency';
import { getPreviousYearMonth, todayString } from '@/utils/date';
import { filterByMonth, getCategoryTotals, sumAmount } from '@/utils/expense-summary';

/** カテゴリ・店名の増加額がこの金額未満の場合は誤差として無視する。 */
const MIN_INCREASE_AMOUNT = 500;
/** 表示する店名インサイトの最大件数。 */
const MAX_STORE_INSIGHTS = 3;
/** 予算に対する使用率がこの割合を超えたら「近づいている」とみなす（budget-progressのcaution判定と合わせる）。 */
const BUDGET_NEAR_RATIO = 0.8;
/** 曜日別の支出が突出していると判定する、平均に対する倍率（Pro限定の詳細分析）。 */
const WEEKDAY_CONCENTRATION_RATIO = 1.5;
/** 曜日別分析を行うために必要な、今月の最低支出件数。 */
const MIN_EXPENSE_COUNT_FOR_WEEKDAY_INSIGHT = 8;

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export type WasteInsightLevel = 'warning' | 'notice' | 'positive';

export interface WasteInsight {
  level: WasteInsightLevel;
  message: string;
}

export interface CategoryChange {
  categoryId: CategoryId;
  thisMonth: number;
  lastMonth: number;
  /** thisMonth - lastMonth */
  difference: number;
}

export interface StoreChange {
  /** 店名専用の入力欄がまだないため、メモ欄の文字列をそのまま店名として扱う。 */
  storeName: string;
  thisMonth: number;
  lastMonth: number;
  /** thisMonth - lastMonth */
  difference: number;
}

export interface WeekdaySpending {
  /** 0=日, 1=月, ..., 6=土 */
  weekday: number;
  label: string;
  total: number;
}

export interface WasteCheckResult {
  yearMonth: string;
  monthTotal: number;
  previousMonthTotal: number;
  /** 前月の記録が1件もない場合はfalse。その場合insightsは空になる。 */
  hasComparableData: boolean;
  /** 前月より増えているカテゴリ（増加額が大きい順）。 */
  increasedCategories: CategoryChange[];
  /** 増加額が最も大きい「注意カテゴリ」。 */
  topWarningCategory: CategoryChange | null;
  /** 前月より増えている店名（メモ）（増加額が大きい順）。 */
  increasedStores: StoreChange[];
  /** 今月最も支出が集中している曜日（Pro限定の詳細分析）。突出していない場合はnull。 */
  topWeekday: WeekdaySpending | null;
  insights: WasteInsight[];
}

function buildCategoryChanges(
  monthExpenses: Expense[],
  previousMonthExpenses: Expense[]
): CategoryChange[] {
  const thisMap = new Map(getCategoryTotals(monthExpenses).map((c) => [c.categoryId, c.total]));
  const lastMap = new Map(
    getCategoryTotals(previousMonthExpenses).map((c) => [c.categoryId, c.total])
  );
  const categoryIds = new Set<CategoryId>([...thisMap.keys(), ...lastMap.keys()]);

  return Array.from(categoryIds)
    .map((categoryId) => {
      const thisMonth = thisMap.get(categoryId) ?? 0;
      const lastMonth = lastMap.get(categoryId) ?? 0;
      return { categoryId, thisMonth, lastMonth, difference: thisMonth - lastMonth };
    })
    .sort((a, b) => b.difference - a.difference);
}

/** メモ欄の文字列を店名の代わりとして集計する（店名専用の入力欄がまだないための代用）。 */
function getStoreTotals(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const storeName = expense.memo?.trim();
    if (!storeName) continue;
    totals.set(storeName, (totals.get(storeName) ?? 0) + expense.amount);
  }
  return totals;
}

function buildStoreChanges(
  monthExpenses: Expense[],
  previousMonthExpenses: Expense[]
): StoreChange[] {
  const thisMap = getStoreTotals(monthExpenses);
  const lastMap = getStoreTotals(previousMonthExpenses);
  const storeNames = new Set<string>([...thisMap.keys(), ...lastMap.keys()]);

  return Array.from(storeNames)
    .map((storeName) => {
      const thisMonth = thisMap.get(storeName) ?? 0;
      const lastMonth = lastMap.get(storeName) ?? 0;
      return { storeName, thisMonth, lastMonth, difference: thisMonth - lastMonth };
    })
    .filter((change) => change.difference >= MIN_INCREASE_AMOUNT)
    .sort((a, b) => b.difference - a.difference);
}

/** 今月の支出が特定の曜日に偏っている場合、その曜日を返す（Pro限定の詳細分析用）。偏りが小さい場合はnull。 */
function findTopWeekday(monthExpenses: Expense[]): WeekdaySpending | null {
  if (monthExpenses.length < MIN_EXPENSE_COUNT_FOR_WEEKDAY_INSIGHT) return null;

  const totals = new Map<number, number>();
  for (const expense of monthExpenses) {
    const [year, month, day] = expense.date.split('-').map(Number);
    const weekday = new Date(year, month - 1, day).getDay();
    totals.set(weekday, (totals.get(weekday) ?? 0) + expense.amount);
  }
  if (totals.size < 2) return null;

  const entries = Array.from(totals.entries());
  const monthTotal = entries.reduce((sum, [, total]) => sum + total, 0);
  const average = monthTotal / entries.length;

  const [topWeekday, topTotal] = entries.sort((a, b) => b[1] - a[1])[0];
  if (average <= 0 || topTotal < average * WEEKDAY_CONCENTRATION_RATIO) return null;

  return { weekday: topWeekday, label: WEEKDAY_LABELS[topWeekday], total: topTotal };
}

function buildInsights(params: {
  monthTotal: number;
  previousMonthTotal: number;
  increasedCategories: CategoryChange[];
  topWarningCategory: CategoryChange | null;
  increasedStores: StoreChange[];
  topWeekday: WeekdaySpending | null;
  budget: number | null;
}): WasteInsight[] {
  const {
    monthTotal,
    previousMonthTotal,
    increasedCategories,
    topWarningCategory,
    increasedStores,
    topWeekday,
    budget,
  } = params;
  const insights: WasteInsight[] = [];

  for (const change of increasedCategories.slice(0, 3)) {
    const label = getCategoryById(change.categoryId).label;
    const isTop = topWarningCategory?.categoryId === change.categoryId;
    insights.push({
      level: isTop ? 'warning' : 'notice',
      message: `今月の${label}が先月より${formatYen(change.difference)}増えています。`,
    });
  }

  for (const change of increasedStores.slice(0, MAX_STORE_INSIGHTS)) {
    insights.push({
      level: 'notice',
      message: `${change.storeName}での支出が増えています。`,
    });
  }

  if (topWeekday) {
    insights.push({
      level: 'notice',
      message: `${topWeekday.label}曜日に支出が集中しています（今月${formatYen(topWeekday.total)}）。`,
    });
  }

  if (budget && budget > 0) {
    const ratio = monthTotal / budget;
    if (ratio >= 1) {
      insights.push({
        level: 'warning',
        message: topWarningCategory
          ? `今月の支出はすでに予算を超えています。${getCategoryById(topWarningCategory.categoryId).label}の支出増加が主な要因です。`
          : '今月の支出はすでに予算を超えています。',
      });
    } else if (ratio >= BUDGET_NEAR_RATIO) {
      insights.push({
        level: 'warning',
        message: topWarningCategory
          ? `${getCategoryById(topWarningCategory.categoryId).label}の支出増加により、今月の予算に近づいています。`
          : '今月の支出が予算に近づいています。',
      });
    }
  }

  if (monthTotal < previousMonthTotal) {
    insights.push({
      level: 'positive',
      message: '今月は先月より支出が少なく、良いペースです。',
    });
  } else if (monthTotal === previousMonthTotal) {
    insights.push({
      level: 'positive',
      message: '今月の支出は先月と同じくらいです。',
    });
  } else if (increasedCategories.length === 0) {
    insights.push({
      level: 'notice',
      message: `今月の支出は先月より${formatYen(monthTotal - previousMonthTotal)}増えています。`,
    });
  }

  return insights;
}

/**
 * 今月と前月の支出を比べ、ムダ買いに気づけるヒントをルールベースで作る。
 * budgetを渡すと予算の使用率に基づく注意も加える（省略時は予算に基づく判定を行わない）。
 */
export function buildWasteCheck(
  expenses: Expense[],
  yearMonth: string = todayString().slice(0, 7),
  budget: number | null = null
): WasteCheckResult {
  const monthExpenses = filterByMonth(expenses, yearMonth);
  const previousYearMonth = getPreviousYearMonth(yearMonth);
  const previousMonthExpenses = filterByMonth(expenses, previousYearMonth);

  const monthTotal = sumAmount(monthExpenses);
  const previousMonthTotal = sumAmount(previousMonthExpenses);
  const hasComparableData = previousMonthExpenses.length > 0;

  const categoryChanges = buildCategoryChanges(monthExpenses, previousMonthExpenses);
  const increasedCategories = categoryChanges.filter((c) => c.difference >= MIN_INCREASE_AMOUNT);
  const topWarningCategory = increasedCategories[0] ?? null;
  const increasedStores = buildStoreChanges(monthExpenses, previousMonthExpenses);
  const topWeekday = findTopWeekday(monthExpenses);

  const insights = hasComparableData
    ? buildInsights({
        monthTotal,
        previousMonthTotal,
        increasedCategories,
        topWarningCategory,
        increasedStores,
        topWeekday,
        budget,
      })
    : [];

  return {
    yearMonth,
    monthTotal,
    previousMonthTotal,
    hasComparableData,
    increasedCategories,
    topWarningCategory,
    increasedStores,
    topWeekday,
    insights,
  };
}
