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

function buildInsights(params: {
  monthTotal: number;
  previousMonthTotal: number;
  increasedCategories: CategoryChange[];
  topWarningCategory: CategoryChange | null;
  increasedStores: StoreChange[];
  budget: number | null;
}): WasteInsight[] {
  const {
    monthTotal,
    previousMonthTotal,
    increasedCategories,
    topWarningCategory,
    increasedStores,
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

  const insights = hasComparableData
    ? buildInsights({
        monthTotal,
        previousMonthTotal,
        increasedCategories,
        topWarningCategory,
        increasedStores,
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
    insights,
  };
}
