import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@recimemo/budget';

/** 月の予算額を取得する。未設定・読み込み失敗時はnullを返す。 */
export async function getBudget(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch (error) {
    console.warn('[budget-storage] 予算の読み込みに失敗しました', error);
    return null;
  }
}

/** 月の予算額を保存する。成功した場合はtrueを返す。 */
export async function setBudget(amount: number): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(amount));
    return true;
  } catch (error) {
    console.warn('[budget-storage] 予算の保存に失敗しました', error);
    return false;
  }
}

/** 予算設定を削除する。成功した場合はtrueを返す。 */
export async function clearBudget(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('[budget-storage] 予算の削除に失敗しました', error);
    return false;
  }
}
