import { getCategoryById } from '@/constants/categories';
import type { Expense } from '@/types/expense';

const CSV_HEADERS = ['日付', '金額', 'カテゴリ', 'メモ', 'レシート写真URI', '作成日時', '更新日時'];

/** ExcelでCSVを開いたときに文字化けしないようにするためのBOM。 */
const BOM = '﻿';

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
