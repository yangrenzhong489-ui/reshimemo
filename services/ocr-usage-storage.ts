import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayString } from '@/utils/date';

const STORAGE_KEY = '@recimemo/ocr-usage';

interface OcrUsageRecord {
  yearMonth: string;
  count: number;
}

function currentYearMonth(): string {
  return todayString().slice(0, 7);
}

async function readUsage(): Promise<OcrUsageRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.yearMonth === 'string' && typeof parsed?.count === 'number') {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn('[ocr-usage-storage] OCR利用回数の読み込みに失敗しました', error);
    return null;
  }
}

/** 今月のOCR実行回数を取得する（月が変わっていれば0を返す）。 */
export async function getOcrUsageCount(): Promise<number> {
  const usage = await readUsage();
  if (!usage || usage.yearMonth !== currentYearMonth()) return 0;
  return usage.count;
}

/** 今月のOCR実行回数を1増やして保存する。 */
export async function incrementOcrUsageCount(): Promise<void> {
  const yearMonth = currentYearMonth();
  const current = await getOcrUsageCount();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ yearMonth, count: current + 1 }));
  } catch (error) {
    console.warn('[ocr-usage-storage] OCR利用回数の保存に失敗しました', error);
  }
}
