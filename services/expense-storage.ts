import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Expense } from '@/types/expense';

const STORAGE_KEY = '@recimemo/expenses';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readAll(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[expense-storage] 支出データの読み込みに失敗しました', error);
    return [];
  }
}

async function writeAll(expenses: Expense[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch (error) {
    console.warn('[expense-storage] 支出データの保存に失敗しました', error);
    return false;
  }
}

/** 支出を全件取得する。読み込みに失敗した場合は空配列を返す。 */
export async function getExpenses(): Promise<Expense[]> {
  return readAll();
}

export type NewExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

/** 支出を1件追加する。保存に失敗した場合はnullを返す。 */
export async function addExpense(input: NewExpenseInput): Promise<Expense | null> {
  const expenses = await readAll();
  const now = new Date().toISOString();
  const newExpense: Expense = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  const success = await writeAll([...expenses, newExpense]);
  return success ? newExpense : null;
}

export type ExpenseUpdateInput = Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>;

/** 指定IDの支出を更新する。対象が見つからない、または保存に失敗した場合はnullを返す。 */
export async function updateExpense(id: string, updates: ExpenseUpdateInput): Promise<Expense | null> {
  const expenses = await readAll();
  const index = expenses.findIndex((expense) => expense.id === id);
  if (index === -1) return null;

  const updated: Expense = { ...expenses[index], ...updates, updatedAt: new Date().toISOString() };
  const next = [...expenses];
  next[index] = updated;

  const success = await writeAll(next);
  return success ? updated : null;
}

/** 指定IDの支出を削除する。成功した場合はtrueを返す。 */
export async function deleteExpense(id: string): Promise<boolean> {
  const expenses = await readAll();
  const next = expenses.filter((expense) => expense.id !== id);
  if (next.length === expenses.length) return false;

  return writeAll(next);
}

/** 支出データを丸ごと置き換える（バックアップからの復元用）。成功した場合はtrueを返す。 */
export async function replaceAllExpenses(expenses: Expense[]): Promise<boolean> {
  return writeAll(expenses);
}

/** 支出データを全件削除する。成功した場合はtrueを返す。 */
export async function clearAllExpenses(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('[expense-storage] 支出データの全件削除に失敗しました', error);
    return false;
  }
}
