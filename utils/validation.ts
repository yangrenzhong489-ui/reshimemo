import type { CategoryId } from '@/types/expense';
import { todayString } from '@/utils/date';

export interface ExpenseValidationInput {
  amountText: string;
  date: string;
  categoryId: CategoryId | null;
  shopName?: string;
  memo?: string;
}

export interface ExpenseValidationErrors {
  amount?: string;
  date?: string;
  category?: string;
  shopName?: string;
  memo?: string;
}

export interface ExpenseValidationResult {
  isValid: boolean;
  errors: ExpenseValidationErrors;
}

/** 金額がこの値以上の場合、確認ダイアログの対象とする（保存自体は禁止しない）。 */
export const LARGE_AMOUNT_THRESHOLD = 10_000_000;

const MAX_SHOP_NAME_LENGTH = 50;
const MAX_MEMO_LENGTH = 300;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' として実在する日付かどうかを厳密にチェックする（2月30日などを弾く）。 */
function isValidCalendarDate(dateString: string): boolean {
  if (!DATE_PATTERN.test(dateString)) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** 支出フォーム（追加・編集共通）の入力内容を検証する。 */
export function validateExpenseForm(input: ExpenseValidationInput): ExpenseValidationResult {
  const errors: ExpenseValidationErrors = {};

  const amountText = input.amountText.trim();
  if (!amountText) {
    errors.amount = '金額を入力してください';
  } else if (!/^\d+$/.test(amountText)) {
    errors.amount = '金額は数字で入力してください';
  } else if (Number(amountText) <= 0) {
    errors.amount = '金額は1円以上で入力してください';
  }

  const date = input.date.trim();
  if (!date) {
    errors.date = '日付を入力してください';
  } else if (!isValidCalendarDate(date)) {
    errors.date = '日付の形式が正しくありません';
  }

  if (!input.categoryId) {
    errors.category = 'カテゴリを選択してください';
  }

  if (input.shopName && input.shopName.length > MAX_SHOP_NAME_LENGTH) {
    errors.shopName = `店名は${MAX_SHOP_NAME_LENGTH}文字以内で入力してください`;
  }

  if (input.memo && input.memo.length > MAX_MEMO_LENGTH) {
    errors.memo = `メモは${MAX_MEMO_LENGTH}文字以内で入力してください`;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/** 金額が高額（確認ダイアログの対象）かどうかを判定する。amountTextは数字のみの文字列を想定。 */
export function isAmountUnusuallyLarge(amountText: string): boolean {
  const amount = Number(amountText);
  return Number.isFinite(amount) && amount >= LARGE_AMOUNT_THRESHOLD;
}

/** 今日より後の日付（未来日付）かどうかを判定する。 */
export function isFutureDate(dateString: string): boolean {
  return isValidCalendarDate(dateString) && dateString > todayString();
}
