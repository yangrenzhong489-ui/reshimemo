import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@recimemo/apple-sign-in';

/**
 * Appleサインインで取得したユーザー情報のローカル保存分。
 * email・fullNameはApple側の仕様上、初回サインイン時にしか返らないため、
 * 2回目以降は既存の保存値を維持する（呼び出し側でマージする）。
 */
export interface AppleSignInProfile {
  userId: string;
  email: string | null;
  fullName: string | null;
}

/** 保存済みのAppleサインイン情報を取得する。未サインイン・読み込み失敗時はnullを返す。 */
export async function getAppleSignInProfile(): Promise<AppleSignInProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[apple-sign-in-storage] サインイン情報の読み込みに失敗しました', error);
    return null;
  }
}

/** Appleサインイン情報を保存する。成功した場合はtrueを返す。 */
export async function saveAppleSignInProfile(profile: AppleSignInProfile): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.warn('[apple-sign-in-storage] サインイン情報の保存に失敗しました', error);
    return false;
  }
}

/** 保存済みのAppleサインイン情報を削除する（サインアウト）。成功した場合はtrueを返す。 */
export async function clearAppleSignInProfile(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('[apple-sign-in-storage] サインイン情報の削除に失敗しました', error);
    return false;
  }
}
