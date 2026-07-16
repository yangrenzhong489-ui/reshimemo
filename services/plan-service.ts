import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PlanId } from '@/constants/plans';
import type { Expense } from '@/types/expense';
import { todayString } from '@/utils/date';

const PLAN_STORAGE_KEY = '@recimemo/current-plan';
const DEFAULT_PLAN: PlanId = 'free';

/** 無料プランの月間の支出記録上限。 */
export const FREE_EXPENSE_LIMIT = 30;

/** プランごとの月間OCR実行回数の上限。 */
export const OCR_LIMITS: Record<PlanId, number> = {
  free: 5,
  plus: 50,
  pro: 200,
};

/**
 * 現在のプランを取得する。
 * 実際の課金連携はまだ無いため、AsyncStorageに保存されたデモ用の値をそのまま
 * 「現在のプラン」として扱う（未設定時はfree）。
 */
export async function getCurrentPlan(): Promise<PlanId> {
  try {
    const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
    if (raw === 'free' || raw === 'plus' || raw === 'pro') return raw;
    return DEFAULT_PLAN;
  } catch (error) {
    console.warn('[plan-service] プランの読み込みに失敗しました', error);
    return DEFAULT_PLAN;
  }
}

/**
 * 開発確認用のデモ機能：実際の課金なしにプランを切り替える。
 * 本番の購入処理ではないため、呼び出し側は必ず「デモ」であることをユーザーに明示すること。
 */
export async function setCurrentPlanForDemo(planId: PlanId): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PLAN_STORAGE_KEY, planId);
    return true;
  } catch (error) {
    console.warn('[plan-service] プランの保存に失敗しました', error);
    return false;
  }
}

/** 支出記録の月間上限。無料プランのみ上限があり、それ以外は無制限（null）。 */
export function getExpenseLimit(planId: PlanId): number | null {
  return planId === 'free' ? FREE_EXPENSE_LIMIT : null;
}

/** 今月のOCR実行回数の上限。 */
export function getOcrLimit(planId: PlanId): number {
  return OCR_LIMITS[planId];
}

/** 実際に記録された日時（createdAt）を基準に、今月記録された支出件数を数える。 */
export function countExpensesThisMonth(
  expenses: Expense[],
  yearMonth: string = todayString().slice(0, 7)
): number {
  return expenses.filter((expense) => expense.createdAt.slice(0, 7) === yearMonth).length;
}

/** CSV出力が利用できるか（Plus以上）。 */
export function canUseCsvExport(planId: PlanId): boolean {
  return planId !== 'free';
}

/** バックアップ・復元が利用できるか（Plus以上）。 */
export function canUseBackup(planId: PlanId): boolean {
  return planId !== 'free';
}

/** ムダ買い分析など、Pro限定機能が利用できるか。 */
export function canUseProFeature(planId: PlanId): boolean {
  return planId === 'pro';
}
