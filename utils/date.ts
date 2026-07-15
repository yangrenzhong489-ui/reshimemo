function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 今日の日付を 'YYYY-MM-DD' 形式で返す。 */
export function todayString(): string {
  return toDateString(new Date());
}

/** 'YYYY-MM-DD' の日付にdelta日を加算した文字列を返す。 */
export function addDays(dateString: string, delta: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  return toDateString(date);
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** 'YYYY-MM-DD' を「2026年7月15日(水)」形式の日本語表記に変換する。 */
export function formatDateLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${year}年${month}月${day}日(${WEEKDAY_LABELS[date.getDay()]})`;
}
