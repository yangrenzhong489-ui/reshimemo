import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricUnavailableReason = 'no-hardware' | 'not-enrolled';

export type BiometricAvailability =
  | { available: true; typeLabel: string }
  | { available: false; reason: BiometricUnavailableReason };

/** 端末が生体認証に対応し、Face ID/指紋などが登録済みかを確認する。 */
export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return { available: false, reason: 'no-hardware' };

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return { available: false, reason: 'not-enrolled' };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeLabel = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? 'Face ID'
      : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? '指紋認証'
        : '生体認証';

    return { available: true, typeLabel };
  } catch (error) {
    console.warn('[app-lock-service] 生体認証の利用可否確認に失敗しました', error);
    return { available: false, reason: 'no-hardware' };
  }
}

/** 生体認証を実行する。成功した場合はtrueを返す（キャンセル・失敗時はfalse）。 */
export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'キャンセル',
    });
    return result.success;
  } catch (error) {
    console.warn('[app-lock-service] 生体認証の実行に失敗しました', error);
    return false;
  }
}
