import { getCategoryById } from '@/constants/categories';
import type { CategoryId, Expense } from '@/types/expense';
import { todayString } from '@/utils/date';
import { filterByMonth, getCategoryTotals, sumAmount } from '@/utils/expense-summary';

/** 分析を行うために必要な、今月の最低支出件数。 */
const MIN_EXPENSE_COUNT = 10;
/** 店舗の時間帯傾向を分析するために必要な、その店舗での最低記録件数。 */
const MIN_STORE_RECORD_COUNT = 3;
/** 週末の支出が偏っていると判定する、平日1日あたりに対する倍率。 */
const WEEKEND_CONCENTRATION_RATIO = 1.5;
/** カテゴリの支出が週末に偏っていると判定するための、最低週末支出額。 */
const MIN_WEEKEND_TOTAL_AMOUNT = 300;
/** 月初・月中・月末のいずれかにカテゴリ支出が偏っていると判定する割合（均等なら約33%）。 */
const PHASE_CONCENTRATION_SHARE = 0.45;
/** 店舗の支出がある時間帯に偏っていると判定する割合。 */
const STORE_TIME_SHARE = 0.5;
const MAX_CATEGORY_TIMING_INSIGHTS = 2;
const MAX_STORE_TIMING_INSIGHTS = 2;
const TOP_CATEGORY_COUNT = 3;
const TOP_STORE_COUNT = 3;

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export type MonthPhase = 'early' | 'mid' | 'late';

const PHASE_LABELS: Record<MonthPhase, string> = {
  early: '月初',
  mid: '月中',
  late: '月末',
};

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: '朝',
  afternoon: '昼',
  evening: '夕方',
  night: '夜',
};

export interface WeekdayPattern {
  weekday: number;
  label: string;
  total: number;
}

export interface MonthPhaseTotal {
  phase: MonthPhase;
  label: string;
  total: number;
}

export interface CategoryTimingInsight {
  categoryId: CategoryId;
  label: string;
  kind: 'weekend' | 'phase';
  phase?: MonthPhase;
}

export interface StoreTimingInsight {
  storeName: string;
  timeOfDay: TimeOfDay;
}

export type PatternInsightLevel = 'highlight' | 'notice';

export interface PatternInsight {
  level: PatternInsightLevel;
  message: string;
}

export interface ShoppingPatternResult {
  yearMonth: string;
  /** 分析に十分な件数の支出が今月に記録されているか。 */
  hasEnoughData: boolean;
  topWeekday: WeekdayPattern | null;
  topMonthPhase: MonthPhaseTotal | null;
  categoryTimingInsights: CategoryTimingInsight[];
  storeTimingInsights: StoreTimingInsight[];
  insights: PatternInsight[];
}

function getMonthPhase(day: number): MonthPhase {
  if (day <= 10) return 'early';
  if (day <= 20) return 'mid';
  return 'late';
}

function getWeekday(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

/** createdAt（記録日時）の時刻を購入の時間帯の目安として扱う（購入時刻そのものではない点に注意）。 */
function getTimeOfDay(createdAt: string): TimeOfDay {
  const hour = new Date(createdAt).getHours();
  if (hour >= 5 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

function findTopWeekday(expenses: Expense[]): WeekdayPattern | null {
  const totals = new Map<number, number>();
  for (const expense of expenses) {
    const weekday = getWeekday(expense.date);
    totals.set(weekday, (totals.get(weekday) ?? 0) + expense.amount);
  }
  if (totals.size === 0) return null;

  const [weekday, total] = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0];
  return { weekday, label: WEEKDAY_LABELS[weekday], total };
}

function findTopMonthPhase(expenses: Expense[]): MonthPhaseTotal | null {
  const totals = new Map<MonthPhase, number>();
  for (const expense of expenses) {
    const day = Number(expense.date.slice(8, 10));
    const phase = getMonthPhase(day);
    totals.set(phase, (totals.get(phase) ?? 0) + expense.amount);
  }
  if (totals.size === 0) return null;

  const [phase, total] = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0];
  return { phase, label: PHASE_LABELS[phase], total };
}

/** 支出額が大きい上位カテゴリについて、週末に偏っているか・月初/中/末に偏っているかを調べる。 */
function findCategoryTimingInsights(expenses: Expense[]): CategoryTimingInsight[] {
  const categoryTotals = getCategoryTotals(expenses);
  const insights: CategoryTimingInsight[] = [];

  for (const { categoryId, total } of categoryTotals.slice(0, TOP_CATEGORY_COUNT)) {
    if (total <= 0) continue;
    const categoryExpenses = expenses.filter((expense) => expense.categoryId === categoryId);
    const label = getCategoryById(categoryId).label;

    const weekendTotal = sumAmount(
      categoryExpenses.filter((expense) => {
        const weekday = getWeekday(expense.date);
        return weekday === 0 || weekday === 6;
      })
    );
    const weekdayTotal = total - weekendTotal;
    const weekendPerDay = weekendTotal / 2;
    const weekdayPerDay = weekdayTotal / 5;

    if (
      weekendTotal >= MIN_WEEKEND_TOTAL_AMOUNT &&
      weekendPerDay >= weekdayPerDay * WEEKEND_CONCENTRATION_RATIO
    ) {
      insights.push({ categoryId, label, kind: 'weekend' });
      continue;
    }

    const phaseTotals = new Map<MonthPhase, number>();
    for (const expense of categoryExpenses) {
      const day = Number(expense.date.slice(8, 10));
      const phase = getMonthPhase(day);
      phaseTotals.set(phase, (phaseTotals.get(phase) ?? 0) + expense.amount);
    }
    const topPhaseEntry = Array.from(phaseTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topPhaseEntry && topPhaseEntry[1] / total >= PHASE_CONCENTRATION_SHARE) {
      insights.push({ categoryId, label, kind: 'phase', phase: topPhaseEntry[0] });
    }
  }

  return insights.slice(0, MAX_CATEGORY_TIMING_INSIGHTS);
}

/** 支出額が大きい上位店舗について、支出が特定の時間帯に偏っているかを調べる。 */
function findStoreTimingInsights(expenses: Expense[]): StoreTimingInsight[] {
  const storeGroups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const storeName = expense.memo?.trim();
    if (!storeName) continue;
    const list = storeGroups.get(storeName) ?? [];
    list.push(expense);
    storeGroups.set(storeName, list);
  }

  const candidates = Array.from(storeGroups.entries())
    .filter(([, list]) => list.length >= MIN_STORE_RECORD_COUNT)
    .map(([storeName, list]) => ({ storeName, total: sumAmount(list), list }))
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_STORE_COUNT);

  const insights: StoreTimingInsight[] = [];
  for (const { storeName, list, total } of candidates) {
    if (total <= 0) continue;
    const timeTotals = new Map<TimeOfDay, number>();
    for (const expense of list) {
      const timeOfDay = getTimeOfDay(expense.createdAt);
      timeTotals.set(timeOfDay, (timeTotals.get(timeOfDay) ?? 0) + expense.amount);
    }
    const topTimeEntry = Array.from(timeTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topTimeEntry && topTimeEntry[1] / total >= STORE_TIME_SHARE) {
      insights.push({ storeName, timeOfDay: topTimeEntry[0] });
    }
  }

  return insights.slice(0, MAX_STORE_TIMING_INSIGHTS);
}

function buildInsightMessages(params: {
  topWeekday: WeekdayPattern | null;
  topMonthPhase: MonthPhaseTotal | null;
  categoryTimingInsights: CategoryTimingInsight[];
  storeTimingInsights: StoreTimingInsight[];
}): PatternInsight[] {
  const { topWeekday, topMonthPhase, categoryTimingInsights, storeTimingInsights } = params;
  const insights: PatternInsight[] = [];

  if (topWeekday) {
    insights.push({ level: 'highlight', message: `${topWeekday.label}曜日の支出が一番多いです。` });
  }

  if (topMonthPhase) {
    insights.push({
      level: 'notice',
      message: `今月は${topMonthPhase.label}に支出が多い傾向があります。`,
    });
  }

  for (const insight of categoryTimingInsights) {
    if (insight.kind === 'weekend') {
      insights.push({ level: 'notice', message: `週末の${insight.label}が多めです。` });
    } else if (insight.phase) {
      insights.push({
        level: 'notice',
        message: `${PHASE_LABELS[insight.phase]}に${insight.label}が増える傾向があります。`,
      });
    }
  }

  for (const insight of storeTimingInsights) {
    insights.push({
      level: 'notice',
      message: `${insight.storeName}の支出は${TIME_OF_DAY_LABELS[insight.timeOfDay]}に増えやすい傾向があります。`,
    });
  }

  return insights;
}

/**
 * 保存済みの支出データから、曜日・時期・カテゴリ・店名ごとの買い物パターンをルールベースで分析する。
 * AI APIは使わず、今月の実績のみから傾向を集計する。
 */
export function analyzeShoppingPattern(
  expenses: Expense[],
  yearMonth: string = todayString().slice(0, 7)
): ShoppingPatternResult {
  const monthExpenses = filterByMonth(expenses, yearMonth);
  const hasEnoughData = monthExpenses.length >= MIN_EXPENSE_COUNT;

  if (!hasEnoughData) {
    return {
      yearMonth,
      hasEnoughData,
      topWeekday: null,
      topMonthPhase: null,
      categoryTimingInsights: [],
      storeTimingInsights: [],
      insights: [],
    };
  }

  const topWeekday = findTopWeekday(monthExpenses);
  const topMonthPhase = findTopMonthPhase(monthExpenses);
  const categoryTimingInsights = findCategoryTimingInsights(monthExpenses);
  const storeTimingInsights = findStoreTimingInsights(monthExpenses);

  const insights = buildInsightMessages({
    topWeekday,
    topMonthPhase,
    categoryTimingInsights,
    storeTimingInsights,
  });

  return {
    yearMonth,
    hasEnoughData,
    topWeekday,
    topMonthPhase,
    categoryTimingInsights,
    storeTimingInsights,
    insights,
  };
}
