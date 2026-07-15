import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getBudget, setBudget } from '@/services/budget-storage';
import { getExpenses, replaceAllExpenses } from '@/services/expense-storage';
import type { Expense } from '@/types/expense';

const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  budget: number | null;
}

export type BackupResult =
  | { success: true }
  | { success: false; reason: 'no-data' | 'not-available' | 'error' };

export type RestoreResult =
  | { success: true }
  | { success: false; reason: 'canceled' | 'invalid-format' | 'error' };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function getBackupFileName(): string {
  const now = new Date();
  return `reshimemo-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`;
}

/** 支出データと予算データを1つのJSONにまとめてバックアップし、共有シートを開く。 */
export async function exportBackup(): Promise<BackupResult> {
  const [expenses, budget] = await Promise.all([getExpenses(), getBudget()]);

  if (expenses.length === 0 && budget === null) {
    return { success: false, reason: 'no-data' };
  }

  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, reason: 'not-available' };
    }

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      expenses,
      budget,
    };

    const file = new File(Paths.cache, getBackupFileName());
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(JSON.stringify(backupData, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'バックアップファイルを共有',
    });

    return { success: true };
  } catch (error) {
    console.warn('[backup-service] バックアップの作成に失敗しました', error);
    return { success: false, reason: 'error' };
  }
}

function isValidExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false;
  const expense = value as Record<string, unknown>;
  return (
    typeof expense.id === 'string' &&
    typeof expense.date === 'string' &&
    typeof expense.amount === 'number' &&
    typeof expense.categoryId === 'string' &&
    typeof expense.createdAt === 'string'
  );
}

/** 未知のオブジェクトが、想定するバックアップJSONの形式かどうかを検証する。 */
function isValidBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;

  if (typeof data.version !== 'number') return false;
  if (!Array.isArray(data.expenses)) return false;
  if (data.budget !== null && typeof data.budget !== 'number') return false;

  return data.expenses.every(isValidExpense);
}

/**
 * ファイルピッカーでJSONバックアップファイルを選び、内容を検証したうえで復元する。
 * 復元前の「上書き確認」はUI側（呼び出し元）で行う想定。
 */
export async function pickAndRestoreBackup(): Promise<RestoreResult> {
  try {
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return { success: false, reason: 'canceled' };
    }

    const file = new File(pickerResult.assets[0].uri);
    const content = await file.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { success: false, reason: 'invalid-format' };
    }

    if (!isValidBackupData(parsed)) {
      return { success: false, reason: 'invalid-format' };
    }

    const expensesRestored = await replaceAllExpenses(parsed.expenses);
    const budgetRestored = parsed.budget === null ? true : await setBudget(parsed.budget);

    if (!expensesRestored || !budgetRestored) {
      return { success: false, reason: 'error' };
    }

    return { success: true };
  } catch (error) {
    console.warn('[backup-service] 復元に失敗しました', error);
    return { success: false, reason: 'error' };
  }
}
