import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Expense } from '@/types/expense';
import { expensesToCsv } from '@/utils/csv';

const CSV_FILE_NAME = 'reshimemo-expenses.csv';

export type ExportCsvResult =
  | { success: true }
  | { success: false; reason: 'no-data' | 'not-available' | 'error' };

/** 支出データをCSVファイルに書き出し、共有シートを開く。 */
export async function exportExpensesCsv(expenses: Expense[]): Promise<ExportCsvResult> {
  if (expenses.length === 0) {
    return { success: false, reason: 'no-data' };
  }

  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, reason: 'not-available' };
    }

    const file = new File(Paths.cache, CSV_FILE_NAME);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(expensesToCsv(expenses));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: '支出データ（CSV）を共有',
    });

    return { success: true };
  } catch (error) {
    console.warn('[csv-export] CSVの出力に失敗しました', error);
    return { success: false, reason: 'error' };
  }
}
