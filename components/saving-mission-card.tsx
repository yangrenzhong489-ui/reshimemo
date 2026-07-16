import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getExpenses } from '@/services/expense-storage';
import { loadMissions } from '@/services/mission-storage';
import { canUseProFeature, getCurrentPlan } from '@/services/plan-service';
import { formatYen } from '@/utils/currency';
import { evaluateMission, type MissionProgress } from '@/utils/saving-missions';

/** 無料・Plusプランでプレビュー表示する件数。 */
const PREVIEW_MISSION_COUNT = 1;

type MissionRowProps = {
  mission: MissionProgress;
};

function MissionRow({ mission }: MissionRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const statusColor =
    mission.status === 'achieved'
      ? colors.success
      : mission.status === 'failed'
        ? colors.danger
        : colors.tint;

  const isAmountMission = mission.type !== 'logging-streak';
  const current = isAmountMission ? (mission.currentAmount ?? 0) : (mission.currentDays ?? 0);
  const target = isAmountMission ? (mission.targetAmount ?? 0) : (mission.targetDays ?? 0);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  let statusText: string;
  if (mission.status === 'achieved') {
    const savedAmount =
      isAmountMission && mission.previousAmount !== undefined
        ? mission.previousAmount - current
        : null;
    statusText =
      savedAmount !== null && savedAmount > 0
        ? `達成しました！${mission.periodLabel === '今週' ? '先週' : '先月'}より${formatYen(savedAmount)}節約できました`
        : '達成しました！';
  } else if (mission.status === 'failed') {
    statusText = '目標を超えてしまいました。次の期間でまた挑戦しましょう。';
  } else if (isAmountMission) {
    statusText = `あと${formatYen(target - current)}まで使えます`;
  } else {
    statusText = `あと${target - current}日で達成です`;
  }

  return (
    <View style={styles.missionRow}>
      <ThemedText style={styles.missionTitle}>
        {mission.periodLabel}のミッション: {mission.title}
      </ThemedText>

      <ThemedText style={styles.missionCurrent}>
        {isAmountMission
          ? `現在: ${formatYen(current)} / ${formatYen(target)}`
          : `現在の連続記録: ${current}日 / ${target}日`}
      </ThemedText>

      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: statusColor }]} />
      </View>

      <ThemedText style={[styles.statusText, { color: statusColor }]}>
        {mission.status === 'achieved' ? '✅ ' : mission.status === 'failed' ? '⚠️ ' : ''}
        {statusText}
      </ThemedText>
    </View>
  );
}

/** 保存済みの支出データから自動生成した「節約ミッション」を表示するカード。Pro限定機能で、無料・Plusは一部プレビューのみ。 */
export function SavingMissionCard() {
  const [missions, setMissions] = useState<MissionProgress[]>([]);
  const [isProUser, setIsProUser] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [expenses, plan] = await Promise.all([getExpenses(), getCurrentPlan()]);
        const definitions = await loadMissions(expenses);
        const progress = definitions.map((mission) => evaluateMission(mission, expenses));
        if (active) {
          setMissions(progress);
          setIsProUser(canUseProFeature(plan));
          setLoaded(true);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  if (!loaded || missions.length === 0) return null;

  const visibleMissions = isProUser ? missions : missions.slice(0, PREVIEW_MISSION_COUNT);

  return (
    <Card variant="filled" style={styles.card}>
      <ThemedText style={styles.title}>🎯 節約ミッション</ThemedText>

      <View style={styles.list}>
        {visibleMissions.map((mission) => (
          <MissionRow key={mission.id} mission={mission} />
        ))}
      </View>

      {!isProUser && (
        <View style={styles.upsell}>
          <ThemedText style={styles.upsellText}>
            🔒 節約ミッションはPro限定機能です。{'\n'}
            Proなら、あなたの支出パターンに合わせて、無理なく続けられる節約目標を自動で提案します。
          </ThemedText>
          <AppButton label="✨ プランを見る" onPress={() => router.push('/plans')} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    gap: 16,
  },
  missionRow: {
    gap: 6,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  missionCurrent: {
    fontSize: 13,
    opacity: 0.8,
  },
  track: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  upsell: {
    gap: 10,
  },
  upsellText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
  },
});
