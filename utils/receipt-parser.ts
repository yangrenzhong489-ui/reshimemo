export interface ParsedReceipt {
  amount: number | null;
  /** 'YYYY-MM-DD' 形式に正規化した日付 */
  date: string | null;
  storeName: string | null;
}

const AMOUNT_KEYWORDS = ['合計', '総計', '税込', 'お支払い', '現計', '小計'];
const AMOUNT_PATTERN = /\d{1,3}(?:,\d{3})+|\d{2,6}/g;

function extractAmountsFromLine(line: string): number[] {
  const matches = line.match(AMOUNT_PATTERN) ?? [];
  return matches
    .map((match) => Number(match.replace(/,/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);
}

/** 「合計」「税込」などのキーワード付近の金額を優先し、無ければ最大値をフォールバックとして採用する。 */
function extractAmount(lines: string[]): number | null {
  const priorityAmounts: number[] = [];

  for (const line of lines) {
    if (AMOUNT_KEYWORDS.some((keyword) => line.includes(keyword))) {
      priorityAmounts.push(...extractAmountsFromLine(line));
    }
  }

  if (priorityAmounts.length > 0) {
    return priorityAmounts[priorityAmounts.length - 1];
  }

  const allAmounts = lines.flatMap(extractAmountsFromLine);
  return allAmounts.length > 0 ? Math.max(...allAmounts) : null;
}

function normalizeDate(year: number, month: number, day: number): string | null {
  const fullYear = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** yyyy年mm月dd日・yyyy/mm/dd・yyyy-mm-dd・yy/mm/dd・yy-mm-dd に対応した日付抽出。 */
function extractDate(text: string): string | null {
  const kanjiMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (kanjiMatch) {
    const [, year, month, day] = kanjiMatch;
    const normalized = normalizeDate(Number(year), Number(month), Number(day));
    if (normalized) return normalized;
  }

  const fourDigitMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (fourDigitMatch) {
    const [, year, month, day] = fourDigitMatch;
    const normalized = normalizeDate(Number(year), Number(month), Number(day));
    if (normalized) return normalized;
  }

  const twoDigitMatch = text.match(/(\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (twoDigitMatch) {
    const [, year, month, day] = twoDigitMatch;
    return normalizeDate(Number(year), Number(month), Number(day));
  }

  return null;
}

/** 数字・記号だけの行かどうか判定する。 */
function isSymbolOnlyLine(line: string): boolean {
  return /^[\d\s\-\/:：¥￥,.　]+$/.test(line);
}

/** 電話番号らしき行（03-1234-5678、090-1234-5678など）かどうか判定する。 */
function looksLikePhoneNumber(line: string): boolean {
  return /\d{2,4}[-‐−]\d{2,4}[-‐−]\d{3,4}/.test(line);
}

/** 郵便番号らしき行（〒123-4567など）かどうか判定する。 */
function looksLikePostalCode(line: string): boolean {
  return /〒\s?\d{3}[-‐−]?\d{4}/.test(line);
}

/** 都道府県を含む住所らしき行かどうか判定する。 */
function looksLikeAddress(line: string): boolean {
  return /[都道府県]/.test(line) && /\d/.test(line);
}

const NON_STORE_NAME_KEYWORDS = [
  'TEL',
  'Tel',
  '電話',
  'FAX',
  'Fax',
  '住所',
  '担当',
  '店員',
  'レジ',
  'No.',
  'NO.',
  '№',
  'responsible',
];

/** 店名候補として不適切な行（電話番号・住所・レジ番号・担当者名など）かどうか判定する。 */
function isLikelyNonStoreNameLine(line: string): boolean {
  return (
    isSymbolOnlyLine(line) ||
    looksLikePhoneNumber(line) ||
    looksLikePostalCode(line) ||
    looksLikeAddress(line) ||
    NON_STORE_NAME_KEYWORDS.some((keyword) => line.includes(keyword))
  );
}

/** OCRテキストの上部の行から、店名らしき候補を1つ選ぶ。 */
function extractStoreName(lines: string[]): string | null {
  const topLines = lines.slice(0, 6);
  const nameCandidate = topLines.find((line) => !isLikelyNonStoreNameLine(line));
  return nameCandidate ?? topLines[0] ?? null;
}

/** OCRで読み取ったレシートのテキストから、合計金額・日付・店名をルールベースで抽出する。 */
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    amount: extractAmount(lines),
    date: extractDate(text),
    storeName: extractStoreName(lines),
  };
}
