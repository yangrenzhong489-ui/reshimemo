import type { PlanId } from '@/constants/plans';

export type BillingCycle = 'monthly' | 'yearly';

/** 実際の課金処理（IAP連携など）はまだ実装していないことを示すフラグ。今後のステップで実装する。 */
export const IS_BILLING_IMPLEMENTED = false;

export type PurchaseResult = { success: false; reason: 'not-implemented' };

/**
 * プラン購入処理のスタブ。
 * 現時点では実際の決済を行わず、常に「未実装」の結果を返す。
 */
export async function purchasePlan(planId: PlanId, cycle: BillingCycle): Promise<PurchaseResult> {
  console.warn(`[billing-service] 課金処理は未実装です（plan: ${planId}, cycle: ${cycle}）`);
  return { success: false, reason: 'not-implemented' };
}
