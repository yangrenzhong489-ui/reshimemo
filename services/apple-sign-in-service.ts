import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import type { AppleSignInProfile } from '@/services/apple-sign-in-storage';

/** この端末・OSでAppleサインインが利用できるか（iOS以外は常にfalse）。 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.warn('[apple-sign-in-service] 利用可否確認に失敗しました', error);
    return false;
  }
}

export type AppleSignInResult =
  | { success: true; profile: AppleSignInProfile }
  | { success: false; reason: 'canceled' | 'error' };

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * Appleでサインインを実行する。
 * user idは毎回取得できるが、email・氏名はApple側の仕様上「初回サインイン時のみ」返される。
 * 2回目以降にemail/fullNameがnullで返ってきても、既存の保存値を呼び出し側でマージして使う想定。
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const fullName = credential.fullName
      ? AppleAuthentication.formatFullName(credential.fullName)
      : null;

    return {
      success: true,
      profile: {
        userId: credential.user,
        email: credential.email,
        fullName: fullName || null,
      },
    };
  } catch (error) {
    if (getErrorCode(error) === 'ERR_REQUEST_CANCELED') {
      return { success: false, reason: 'canceled' };
    }
    console.warn('[apple-sign-in-service] サインインに失敗しました', error);
    return { success: false, reason: 'error' };
  }
}
