const formatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

/** 金額を「¥1,234」形式の日本円表示に変換する。 */
export function formatYen(amount: number): string {
  return formatter.format(amount);
}
