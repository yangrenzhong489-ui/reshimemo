import * as Notifications from 'expo-notifications';

import {
  getBudgetAlertState,
  getNotificationSettings,
  saveBudgetAlertState,
} from '@/services/notification-settings-storage';
import { getBudgetStatus, type BudgetStatus } from '@/utils/budget';
import { todayString } from '@/utils/date';

const DAILY_REMINDER_IDENTIFIER = 'daily-expense-reminder';
const MISSION_REMINDER_IDENTIFIER = 'mission-reminder';
/** expo-notificationsのWEEKLYトリガーは1=日曜始まりのため、月曜は2。 */
const MISSION_REMINDER_WEEKDAY = 2;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** 現在の通知許可状態を取得する。 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** 通知許可をリクエストする。許可された場合はtrueを返す。 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** 毎日決まった時刻に「今日の支出を記録しましたか？」通知を予約する（既存の予約は置き換える）。 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDENTIFIER,
    content: {
      title: 'レシメモ',
      body: '今日の支出を記録しましたか？',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** 毎日のリマインダー通知の予約を取り消す。 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDENTIFIER);
  } catch {
    // 予約が存在しない場合は何もしない。
  }
}

/** 毎週月曜、決まった時刻に「節約ミッション」を確認するよう促す通知を予約する（既存の予約は置き換える）。 */
export async function scheduleMissionReminder(hour: number, minute: number): Promise<void> {
  await cancelMissionReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: MISSION_REMINDER_IDENTIFIER,
    content: {
      title: 'レシメモ',
      body: '🎯 今週の節約ミッションをチェックしましょう！',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: MISSION_REMINDER_WEEKDAY,
      hour,
      minute,
    },
  });
}

/** 節約ミッションのリマインダー通知の予約を取り消す。 */
export async function cancelMissionReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(MISSION_REMINDER_IDENTIFIER);
  } catch {
    // 予約が存在しない場合は何もしない。
  }
}

const BUDGET_ALERT_MESSAGES: Record<'caution' | 'over', { title: string; body: string }> = {
  caution: { title: 'レシメモ', body: '今月の支出が予算の80%を超えました。' },
  over: { title: 'レシメモ', body: '今月の支出が予算を超えました。' },
};

const STATUS_RANK: Record<BudgetStatus, number> = { normal: 0, caution: 1, over: 2 };

/**
 * 今月の支出状況を確認し、予算の80%/100%を新たに超えた場合のみ通知する。
 * 同じ月・同じ段階（またはそれ以上）で既に通知済みの場合は再送しない。
 */
export async function checkAndNotifyBudgetStatus(spent: number, budget: number | null): Promise<void> {
  if (budget === null) return;

  const settings = await getNotificationSettings();
  if (!settings.budgetAlertsEnabled) return;

  const permissionStatus = await getNotificationPermissionStatus();
  if (permissionStatus !== 'granted') return;

  const status = getBudgetStatus(spent, budget);
  if (status === 'normal') return;

  const thisMonth = todayString().slice(0, 7);
  const previousState = await getBudgetAlertState();
  const previousRank =
    previousState && previousState.month === thisMonth ? STATUS_RANK[previousState.lastStatus] : 0;

  if (STATUS_RANK[status] <= previousRank) return;

  const message = BUDGET_ALERT_MESSAGES[status];
  await Notifications.scheduleNotificationAsync({
    content: { title: message.title, body: message.body },
    trigger: null,
  });
  await saveBudgetAlertState({ month: thisMonth, lastStatus: status });
}
