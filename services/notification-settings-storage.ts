import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = '@recimemo/notification-settings';
const BUDGET_ALERT_STATE_KEY = '@recimemo/budget-alert-state';

export interface NotificationSettings {
  dailyReminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  budgetAlertsEnabled: boolean;
  /** 節約ミッションのリマインダー通知（毎週月曜、reminderHour/reminderMinuteの時刻に送信）。Pro限定機能。 */
  missionRemindersEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  budgetAlertsEnabled: true,
  missionRemindersEnabled: false,
};

/** 通知設定を取得する。未設定・読み込み失敗時は既定値を返す。 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.warn('[notification-settings-storage] 設定の読み込みに失敗しました', error);
    return DEFAULT_SETTINGS;
  }
}

/** 通知設定を保存する。成功した場合はtrueを返す。 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.warn('[notification-settings-storage] 設定の保存に失敗しました', error);
    return false;
  }
}

export interface BudgetAlertState {
  /** 'YYYY-MM' */
  month: string;
  lastStatus: 'caution' | 'over';
}

/** 予算超過通知の重複送信を防ぐための、直近の通知状態を取得する。 */
export async function getBudgetAlertState(): Promise<BudgetAlertState | null> {
  try {
    const raw = await AsyncStorage.getItem(BUDGET_ALERT_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[notification-settings-storage] 通知状態の読み込みに失敗しました', error);
    return null;
  }
}

export async function saveBudgetAlertState(state: BudgetAlertState): Promise<boolean> {
  try {
    await AsyncStorage.setItem(BUDGET_ALERT_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('[notification-settings-storage] 通知状態の保存に失敗しました', error);
    return false;
  }
}
