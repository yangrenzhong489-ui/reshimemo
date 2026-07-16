import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { WasteCheckResult, WasteInsightLevel } from '@/utils/waste-detection';

const LEVEL_ICON: Record<WasteInsightLevel, string> = {
  warning: '⚠️',
  notice: '👀',
  positive: '✅',
};

/** 無料・Plusプランでプレビュー表示する件数。 */
const PREVIEW_INSIGHT_COUNT = 1;

type WasteCheckCardProps = {
  result: WasteCheckResult;
  /** Proプランの場合はtrue。falseの場合は一部プレビューのみ表示し、アップグレード導線を出す。 */
  isProUser: boolean;
};

/** 今月と前月の支出を比べた「ムダ買いチェック」の結果を表示するカード。ムダ買い発見はPro限定機能。 */
export function WasteCheckCard({ result, isProUser }: WasteCheckCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const levelColor: Record<WasteInsightLevel, string | undefined> = {
    warning: colors.danger,
    notice: undefined,
    positive: colors.success,
  };

  const visibleInsights = isProUser
    ? result.insights
    : result.insights.slice(0, PREVIEW_INSIGHT_COUNT);
  const hiddenCount = result.insights.length - visibleInsights.length;

  return (
    <Card variant="filled" style={styles.card}>
      <ThemedText style={styles.title}>🔎 ムダ買いチェック</ThemedText>

      {result.hasComparableData ? (
        <View style={styles.list}>
          {visibleInsights.map((insight, index) => (
            <View key={index} style={styles.row}>
              <ThemedText style={styles.icon}>{LEVEL_ICON[insight.level]}</ThemedText>
              <ThemedText
                style={[
                  styles.message,
                  levelColor[insight.level]
                    ? { color: levelColor[insight.level], fontWeight: '700' }
                    : null,
                ]}>
                {insight.message}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText style={styles.emptyText}>
          先月分の記録がまだないため比較できません。来月から表示されます。
        </ThemedText>
      )}

      {!isProUser && result.hasComparableData && (
        <View style={styles.upsell}>
          <ThemedText style={styles.upsellTitle}>🔒 ムダ買いチェックはPro限定機能です。</ThemedText>
          <ThemedText style={styles.upsellText}>
            Proなら、今月と先月の支出を比較して、増えているカテゴリやお店を自動でお知らせします。{'\n'}
            なんとなく使いすぎた、を、ここを減らせばいい、に変えましょう。
          </ThemedText>
          <ThemedText style={styles.upsellText}>
            {hiddenCount > 0 ? `他に${hiddenCount}件のヒントを含め、` : ''}
            Proなら、増えたカテゴリ・お店・曜日まで詳しく確認できます。
          </ThemedText>
          <AppButton
            label="🔓 Proで詳しいムダ買い分析を解放"
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
