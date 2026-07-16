import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PatternInsightLevel, ShoppingPatternResult } from '@/utils/shopping-pattern-analysis';

const LEVEL_ICON: Record<PatternInsightLevel, string> = {
  highlight: '📌',
  notice: '🔍',
};

/** 無料・Plusプランでプレビュー表示する件数。 */
const PREVIEW_INSIGHT_COUNT = 1;

type ShoppingPatternCardProps = {
  result: ShoppingPatternResult;
  /** Proプランの場合はtrue。falseの場合は一部プレビューのみ表示し、アップグレード導線を出す。 */
  isProUser: boolean;
};

/** 曜日・時期・カテゴリ・店名ごとの買い物パターンを表示するカード。買い物パターン分析はPro限定機能。 */
export function ShoppingPatternCard({ result, isProUser }: ShoppingPatternCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!result.hasEnoughData) {
    return (
      <Card variant="filled" style={styles.card}>
        <ThemedText style={styles.title}>🧭 買い物パターン分析</ThemedText>
        <ThemedText style={styles.emptyText}>
          今月の記録がもう少し増えると分析できます。支出の記録を続けましょう。
        </ThemedText>
      </Card>
    );
  }

  const visibleInsights = isProUser
    ? result.insights
    : result.insights.slice(0, PREVIEW_INSIGHT_COUNT);
  const hiddenCount = result.insights.length - visibleInsights.length;

  return (
    <Card variant="filled" style={styles.card}>
      <ThemedText style={styles.title}>🧭 買い物パターン分析</ThemedText>

      <View style={styles.list}>
        {visibleInsights.map((insight, index) => (
          <View key={index} style={styles.row}>
            <ThemedText style={styles.icon}>{LEVEL_ICON[insight.level]}</ThemedText>
            <ThemedText
              style={[
                styles.message,
                insight.level === 'highlight' ? { color: colors.tint, fontWeight: '700' } : null,
              ]}>
              {insight.message}
            </ThemedText>
          </View>
        ))}
      </View>

      {!isProUser && (
        <View style={styles.upsell}>
          <ThemedText style={styles.upsellTitle}>🔒 買い物パターン分析はPro限定機能です。</ThemedText>
          <ThemedText style={styles.upsellText}>
            Proなら、曜日・時期・カテゴリごとの支出傾向を自動で分析し、あなたの買い物のクセを見える化できます。
            {hiddenCount > 0 ? `（他に${hiddenCount}件の分析があります）` : ''}
          </ThemedText>
          <AppButton
            label="🔓 Proで買い物パターン分析を解放"
            onPress={() => router.push('/plans')}
          />
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
  emptyText: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    fontSize: 15,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  upsell: {
    gap: 8,
  },
  upsellTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  upsellText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
  },
});
