import { useFocusEffect } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ScreenContainer } from '@/components/screen-container';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { TimeStepper } from '@/components/time-stepper';
import { PLANS, type PlanId } from '@/constants/plans';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCsvExport } from '@/hooks/use-csv-export';
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
  type BiometricAvailability,
} from '@/services/app-lock-service';
import {
  getAppLockSettings,
  saveAppLockSettings,
  type AppLockSettings,
} from '@/services/app-lock-settings-storage';
import { isAppleSignInAvailable, signInWithApple } from '@/services/apple-sign-in-service';
import {
  clearAppleSignInProfile,
  getAppleSignInProfile,
  saveAppleSignInProfile,
  type AppleSignInProfile,
} from '@/services/apple-sign-in-storage';
import { exportBackup, pickAndRestoreBackup } from '@/services/backup-service';
import { clearBudget } from '@/services/budget-storage';
import { clearAllExpenses, getExpenses } from '@/services/expense-storage';
import {
  cancelDailyReminder,
  cancelMissionReminder,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleMissionReminder,
} from '@/services/notification-service';
import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/services/notification-settings-storage';
import { canUseBackup, canUseCsvExport, canUseProFeature, getCurrentPlan } from '@/services/plan-service';
import { deleteReceiptPhoto } from '@/services/receipt-photo-storage';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function goToPlans(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'キャンセル', style: 'cancel' },
    { text: 'プランを見る', onPress: () => router.push('/plans') },
  ]);
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { exporting, handleExportCsv } = useCsvExport();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [appLockSettings, setAppLockSettingsState] = useState<AppLockSettings | null>(null);
  const [biometricAvailability, setBiometricAvailability] = useState<BiometricAvailability | null>(
    null
  );
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleProfile, setAppleProfileState] = useState<AppleSignInProfile | null>(null);
  const [appleSigningIn, setAppleSigningIn] = useState(false);

  useEffect(() => {
    getNotificationSettings().then(setNotificationSettings);
    getAppLockSettings().then(setAppLockSettingsState);
    getAppleSignInProfile().then(setAppleProfileState);
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getCurrentPlan().then((plan) => {
        if (active) setCurrentPlan(plan);
      });
      getBiometricAvailability().then((availability) => {
        if (active) setBiometricAvailability(availability);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const ensureNotificationPermission = async (): Promise<boolean> => {
    const status = await getNotificationPermissionStatus();
    if (status === 'granted') return true;

    const granted = await requestNotificationPermission();
    if (granted) return true;

    Alert.alert(
      '通知を利用できません',
      '通知の許可がオフになっています。端末の設定アプリからレシメモの通知を許可してください。'
    );
    return false;
  };

  const updateNotificationSettings = async (next: NotificationSettings) => {
    setNotificationSettings(next);
    await saveNotificationSettings(next);
  };

  const handleToggleDailyReminder = async (value: boolean) => {
    if (!notificationSettings) return;

    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) return;
    }

    const next = { ...notificationSettings, dailyReminderEnabled: value };
    await updateNotificationSettings(next);

    if (value) {
      await scheduleDailyReminder(next.reminderHour, next.reminderMinute);
    } else {
      await cancelDailyReminder();
    }
  };

  const handleChangeReminderTime = async (hour: number, minute: number) => {
    if (!notificationSettings) return;

    const next = { ...notificationSettings, reminderHour: hour, reminderMinute: minute };
    await updateNotificationSettings(next);

    if (next.dailyReminderEnabled) {
      await scheduleDailyReminder(hour, minute);
    }
    if (next.missionRemindersEnabled) {
      await scheduleMissionReminder(hour, minute);
    }
  };

  const handleToggleBudgetAlerts = async (value: boolean) => {
    if (!notificationSettings) return;

    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) return;
    }

    await updateNotificationSettings({ ...notificationSettings, budgetAlertsEnabled: value });
  };

  const handleToggleMissionReminders = async (value: boolean) => {
    if (!notificationSettings) return;

    if (value && !canUseProFeature(currentPlan)) {
      goToPlans('節約ミッションのリマインダーはPro限定機能です', '');
      return;
    }

    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) return;
    }

    const next = { ...notificationSettings, missionRemindersEnabled: value };
    await updateNotificationSettings(next);

    if (value) {
      await scheduleMissionReminder(next.reminderHour, next.reminderMinute);
    } else {
      await cancelMissionReminder();
    }
  };

  const handleToggleAppLock = async (value: boolean) => {
    if (!appLockSettings) return;

    if (value) {
      const availability = await getBiometricAvailability();
      setBiometricAvailability(availability);

      if (!availability.available) {
        Alert.alert(
          '生体認証を利用できません',
          availability.reason === 'not-enrolled'
            ? 'Face ID・指紋などがこの端末に登録されていません。端末の設定アプリから登録すると利用できます。'
            : 'この端末はFace ID・指紋認証に対応していません。'
        );
        return;
      }

      const success = await authenticateWithBiometrics('アプリロックを有効にするため認証してください');
      if (!success) {
        Alert.alert('認証に失敗しました', 'もう一度お試しください。');
        return;
      }
    }

    const next = { ...appLockSettings, enabled: value };
    setAppLockSettingsState(next);
    await saveAppLockSettings(next);
  };

  const handleAppleSignIn = async () => {
    if (appleSigningIn) return;

    setAppleSigningIn(true);
    try {
      const result = await signInWithApple();

      if (result.success) {
        // email・氏名は初回サインイン時のみ返るため、既存の保存値があればマージして維持する。
        const merged: AppleSignInProfile = {
          userId: result.profile.userId,
          email: result.profile.email ?? appleProfile?.email ?? null,
          fullName: result.profile.fullName ?? appleProfile?.fullName ?? null,
        };
        setAppleProfileState(merged);
        await saveAppleSignInProfile(merged);
        return;
      }

      if (result.reason === 'canceled') {
        Alert.alert('サインインをキャンセルしました');
        return;
      }
      Alert.alert('サインインに失敗しました', 'もう一度お試しください。');
    } finally {
      setAppleSigningIn(false);
    }
  };

  const handleAppleSignOut = () => {
    Alert.alert('サインアウトしますか？', '端末に保存されたApple サインイン情報を削除します。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'サインアウト',
        style: 'destructive',
        onPress: async () => {
          setAppleProfileState(null);
          await clearAppleSignInProfile();
        },
      },
    ]);
  };

  const handleBackup = async () => {
    if (backingUp) return;

    if (!canUseBackup(currentPlan)) {
      goToPlans('バックアップ・復元はPlus以上で利用できます', '');
      return;
    }

    setBackingUp(true);
    try {
      const result = await exportBackup();

      if (result.success) {
        Alert.alert('バックアップを作成しました', '共有シートからファイルを保存・送信できます。');
        return;
      }

      if (result.reason === 'no-data') {
        Alert.alert('バックアップするデータがありません');
        return;
      }
      if (result.reason === 'not-available') {
        Alert.alert('共有機能が利用できません', 'この端末では共有機能を利用できませんでした。');
        return;
      }
      Alert.alert('バックアップの作成に失敗しました', 'もう一度お試しください。');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = () => {
    if (restoring) return;

    if (!canUseBackup(currentPlan)) {
      goToPlans('バックアップ・復元はPlus以上で利用できます', '');
      return;
    }

    Alert.alert(
      '現在のデータを上書きしますか？',
      '選択したバックアップファイルの内容で、現在の支出データと予算データがすべて置き換わります。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '復元する', style: 'destructive', onPress: runRestore },
      ]
    );
  };

  const runRestore = async () => {
    setRestoring(true);
    try {
      const result = await pickAndRestoreBackup();

      if (result.success) {
        Alert.alert('データを復元しました', '', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      if (result.reason === 'canceled') {
        return;
      }
      if (result.reason === 'invalid-format') {
        Alert.alert(
          '復元できませんでした',
          'ファイルの形式が正しくないか、レシメモのバックアップファイルではないようです。'
        );
        return;
      }
      Alert.alert('復元に失敗しました', 'もう一度お試しください。');
    } finally {
      setRestoring(false);
    }
  };

  const handlePressCsvExport = () => {
    if (!canUseCsvExport(currentPlan)) {
      goToPlans('CSV出力はPlus以上で利用できます', '');
      return;
    }
    handleExportCsv();
  };

  const handleDeleteAll = () => {
    if (deletingAll) return;

    Alert.alert(
      '本当にすべてのデータを削除しますか？',
      'この操作は取り消せません。支出データ・予算設定・保存されたレシート写真がすべて削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: runDeleteAll },
      ]
    );
  };

  const runDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const expenses = await getExpenses();
      for (const expense of expenses) {
        if (expense.photoUri) {
          deleteReceiptPhoto(expense.photoUri);
        }
      }

      const expensesCleared = await clearAllExpenses();
      const budgetCleared = await clearBudget();

      if (expensesCleared && budgetCleared) {
        Alert.alert('すべてのデータを削除しました', '', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }
      Alert.alert('削除に失敗しました', 'もう一度お試しください。');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>通知</ThemedText>

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <ThemedText style={styles.toggleLabel}>毎日のリマインダー</ThemedText>
            <Switch
              value={notificationSettings?.dailyReminderEnabled ?? false}
              onValueChange={handleToggleDailyReminder}
              disabled={!notificationSettings}
            />
          </View>

          {(notificationSettings?.dailyReminderEnabled ||
            notificationSettings?.missionRemindersEnabled) && (
            <View style={[styles.timeRow, { borderColor: colors.border }]}>
              <ThemedText style={styles.toggleLabel}>通知時刻</ThemedText>
              <TimeStepper
                hour={notificationSettings.reminderHour}
                minute={notificationSettings.reminderMinute}
                onChange={handleChangeReminderTime}
              />
            </View>
          )}

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <ThemedText style={styles.toggleLabel}>予算超過の通知</ThemedText>
            <Switch
              value={notificationSettings?.budgetAlertsEnabled ?? false}
              onValueChange={handleToggleBudgetAlerts}
              disabled={!notificationSettings}
            />
          </View>
          <ThemedText style={styles.hintText}>
            今月の支出が予算の80%・100%を超えたタイミングで通知します。
          </ThemedText>

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <ThemedText style={styles.toggleLabel}>節約ミッションのリマインダー</ThemedText>
            <Switch
              value={notificationSettings?.missionRemindersEnabled ?? false}
              onValueChange={handleToggleMissionReminders}
              disabled={!notificationSettings}
            />
          </View>
          <ThemedText style={styles.hintText}>
            毎週月曜、通知時刻に節約ミッションの確認を促します。Pro限定機能です。
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>アプリロック</ThemedText>

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <ThemedText style={styles.toggleLabel}>
              {biometricAvailability?.available
                ? `${biometricAvailability.typeLabel}でロック`
                : '生体認証でロック'}
            </ThemedText>
            <Switch
              value={appLockSettings?.enabled ?? false}
              onValueChange={handleToggleAppLock}
              disabled={!appLockSettings}
            />
          </View>
          <ThemedText style={styles.hintText}>
            {biometricAvailability && !biometricAvailability.available
              ? biometricAvailability.reason === 'not-enrolled'
                ? 'この端末にFace ID・指紋などが登録されていないため利用できません。端末の設定アプリから登録すると使えるようになります。'
                : 'この端末はFace ID・指紋認証に対応していないため利用できません。'
              : '起動時とアプリ再開時に生体認証を求め、支出データやレシート画像を保護します。'}
          </ThemedText>
        </View>

        {Platform.OS === 'ios' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Appleでサインイン</ThemedText>

            {appleProfile ? (
              <View style={styles.appleSignedInBlock}>
                <ThemedText style={styles.toggleLabel}>✅ サインイン済み</ThemedText>
                {appleProfile.fullName && (
                  <ThemedText style={styles.hintText}>{appleProfile.fullName}</ThemedText>
                )}
                {appleProfile.email && (
                  <ThemedText style={styles.hintText}>{appleProfile.email}</ThemedText>
                )}
                <AppButton
                  label="サインアウト"
                  variant="dangerOutline"
                  onPress={handleAppleSignOut}
                  style={styles.appleSignOutButton}
                />
              </View>
            ) : appleAvailable ? (
              <>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={
                    colorScheme === 'dark'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={12}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
                <ThemedText style={styles.hintText}>
                  クラウド同期・Proプラン管理・バックアップ復元の準備として、Appleアカウントでサインインできます（実際の同期はまだ行われません）。
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.hintText}>
                この端末ではAppleサインインを利用できません。iOSのみ対応の機能です。
              </ThemedText>
            )}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>プラン</ThemedText>
          <SettingsRow
            icon="✨"
            label={`プランを見る（現在: ${PLANS.find((p) => p.id === currentPlan)?.label ?? 'Free'}）`}
            onPress={() => router.push('/plans')}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>データ管理</ThemedText>
          <SettingsRow icon="📄" label="CSV出力" loading={exporting} onPress={handlePressCsvExport} />
          <SettingsRow
            icon="💾"
            label="データをバックアップ"
            loading={backingUp}
            onPress={handleBackup}
          />
          <SettingsRow icon="📥" label="データを復元" loading={restoring} onPress={handleRestore} />
          <SettingsRow icon="🎯" label="予算を設定" onPress={() => router.push('/set-budget')} />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>危険な操作</ThemedText>
          <SettingsRow
            icon="🗑️"
            label="すべてのデータを削除"
            loading={deletingAll}
            destructive
            onPress={handleDeleteAll}
          />
        </View>

        <View style={styles.appInfoSection}>
          <ThemedText style={styles.appInfoTitle}>レシメモ</ThemedText>
          <ThemedText style={styles.appInfoText}>バージョン {APP_VERSION}</ThemedText>
          <ThemedText style={styles.appInfoText}>レシート写真付き支出メモアプリ</ThemedText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    lineHeight: 18,
  },
  appInfoSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  appInfoText: {
    fontSize: 12,
    opacity: 0.6,
  },
  appleButton: {
    height: 48,
    width: '100%',
  },
  appleSignedInBlock: {
    gap: 4,
  },
  appleSignOutButton: {
    marginTop: 8,
  },
});
