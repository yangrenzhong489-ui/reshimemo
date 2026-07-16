import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { formatYen } from '@/utils/currency';
import type { PurchaseFrequencyResult } from '@/utils/purchase-frequency-ranking';

/** 無料・Plusプランでプレビュー表示する件数。 */
const PREVIEW_CATEGORY_COUNT = 1;

type PurchaseFrequencyCardProps = {
  result: PurchaseFrequencyResult;
  /** Proプランの場合はtrue。falseの場合は一部プレビューのみ表示し、アップグレード導線を出す。 */
  isProUser: boolean;
};

/** 今月「よく買っているもの」をカテゴリ・お店の購入回数で見せるカード。よく買うものランキングはPro限定機能。 */
export function PurchaseFrequencyCard({ result, isProUser }: PurchaseFrequencyCardProps) {
  if (!result.hasEnoughData) {
    return (
      <Card variant="filled" style={styles.card}>
        <ThemedText style={styles.title}>🛒 よく買うものランキング</ThemedText>
        <ThemedText style={styles.emptyText}>
          今月の記録がもう少し増えると分析できます。支出の記録を続けましょう。
        </ThemedText>
      </Card>
    );
  }

  const visibleCategories = isProUser
    ? result.topCategories
    : result.topCategories.slice(0, PREVIEW_CATEGORY_COUNT);

  return (
    <Card variant="filled" style={styles.card}>
      <ThemedText style={styles.title}>🛒 よく買うものランキング</ThemedText>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>カテゴリ別（購入回数）</ThemedText>
        <View style={styles.list}>
          {visibleCategories.map((item, index) => (
            <View key={item.categoryId} style={styles.row}>
              <ThemedText style={styles.rankNumber}>{index + 1}位</ThemedText>
              <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
              <ThemedText style={styles.itemLabel}>{item.label}</ThemedText>
              <ThemedText style={styles.itemValue}>{item.count}回</ThemedText>
            </View>
          ))}
        </View>
      </View>

      {isProUser && result.topStores.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>お店別（購入回数）</ThemedText>
          <View style={styles.list}>
            {result.topStores.map((item, index) => (
              <View key={item.storeName} style={styles.row}>
                <ThemedText style={styles.rankNumber}>{index + 1}位</ThemedText>
                <ThemedText style={styles.itemLabel}>{item.storeName}</ThemedText>
                <ThemedText style={styles.itemValue}>
                  {item.count}回 / {formatYen(item.total)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {!isProUser && (
        <View style={styles.upsell}>
          <ThemedText style={styles.upsellTitle}>🔒 よく買うものランキングはPro限定機能です。</ThemedText>
          <ThemedText style={styles.upsellText}>
            Proなら、カテゴリ別・お店別の購入回数ランキングをすべて確認でき、自分の買い物のクセを見える化できます。
          </ThemedText>
          <AppButton
            label="🔓 Proでよく買うものランキングを解放"
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
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    width: 32,
  },
  emoji: {
    fontSize: 15,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '700',
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
