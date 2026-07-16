import { getCategoryById } from '@/constants/categories';
import type { Expense } from '@/types/expense';

const CSV_HEADERS = ['日付', '金額', 'カテゴリ', 'メモ', 'レシート写真URI', '作成日時', '更新日時'];

/** ExcelでCSVを開いたときに文字化けしないようにするためのBOM。 */
const BOM = '﻿';

/** '='や'+'などで始まる値は、Excel等で開いた際に数式として実行されうる（CSVインジェクション）ため無害化する。 */
const FORMULA_TRIGGER_PATTERN = /^[=+\-@\t\r]/;

function escapeCsvField(value: string): string {
  const sanitized = FORMULA_TRIGGER_PATTERN.test(value) ? `'${value}` : value;

  if (/[",\n]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/** 支出データをCSV形式の文字列に変換する。 */
export function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map((expense) => {
    const category = getCategoryById(expense.categoryId);
    return [
      expense.date,
      String(expense.amount),
      category.label,
      expense.memo ?? '',
      expense.photoUri ?? '',
      expense.createdAt,
      expense.updatedAt ?? expense.createdAt,
    ]
      .map(escapeCsvField)
      .join(',');
  });

  return BOM + [CSV_HEADERS.join(','), ...rows].join('\n');
}
