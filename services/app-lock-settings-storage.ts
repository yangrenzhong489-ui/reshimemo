import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@recimemo/app-lock-settings';

export interface AppLockSettings {
  /** trueの場合、起動時・アプリ再開時に生体認証を求める。 */
  enabled: boolean;
}

const DEFAULT_SETTINGS: AppLockSettings = {
  enabled: false,
};

/** アプリロック設定を取得する。未設定・読み込み失敗時は既定値（無効）を返す。 */
export async function getAppLockSettings(): Promise<AppLockSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.warn('[app-lock-settings-storage] 設定の読み込みに失敗しました', error);
    return DEFAULT_SETTINGS;
  }
}

/** アプリロック設定を保存する。成功した場合はtrueを返す。 */
export async function saveAppLockSettings(settings: AppLockSettings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.warn('[app-lock-settings-storage] 設定の保存に失敗しました', error);
    return false;
  }
}
