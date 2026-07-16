import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/card';
import { ScreenContainer } from '@/components/screen-container';
import { SegmentedFilter } from '@/components/segmented-filter';
import { ThemedText } from '@/components/themed-text';
import { PLANS, type Plan, type PlanId } from '@/constants/plans';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { purchasePlan, type BillingCycle } from '@/services/billing-service';
import { getCurrentPlan, setCurrentPlanForDemo } from '@/services/plan-service';
import { formatYen } from '@/utils/currency';

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月払い' },
  { value: 'yearly', label: '年払い（お得）' },
];

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export default function PlansScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getCurrentPlan().then((plan) => {
        if (active) setCurrentPlan(plan);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const switchToDemoPlan = async (planId: PlanId) => {
    await setCurrentPlanForDemo(planId);
    setCurrentPlan(planId);
  };

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlan) {
      router.back();
      return;
    }

    if (plan.id === 'free') {
      Alert.alert(
        'デモとして無料プランに戻しますか？',
        '実際の解約処理ではなく、動作確認用の切り替えです。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '無料プランに戻す',
            onPress: () => switchToDemoPlan('free'),
          },
        ]
      );
      return;
    }

    purchasePlan(plan.id, cycle).then(() => {
      Alert.alert(
        '現在はデモです',
        '課金処理は未実装です。動作確認のため、デモとしてこのプランに切り替えますか？（実際の購入ではありません）',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'デモで切り替える',
            onPress: () => switchToDemoPlan(plan.id),
          },
        ]
      );
    });
  };

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <ThemedText style={[styles.eyebrow, { color: colors.tint }]}>レシメモ Pro</ThemedText>
          <ThemedText style={styles.headline}>記録するだけで終わらない。</ThemedText>
          <ThemedText style={styles.subheadline}>
            ムダ買いに気づいて、自然に節約できる家計簿。
          </ThemedText>
          <ThemedText style={styles.currentPlanText}>
            現在のプラン: {PLANS.find((p) => p.id === currentPlan)?.label ?? 'Free'}（デモ）
          </ThemedText>
        </View>

        <SegmentedFilter options={CYCLE_OPTIONS} value={cycle} onChange={setCycle} />

        {PLANS.map((plan) => {
          const dailyPrice = plan.price
            ? Math.round(
                (cycle === 'monthly' ? plan.price.monthly : plan.price.yearly) /
                  (cycle === 'monthly' ? DAYS_PER_MONTH : DAYS_PER_YEAR)
              )
            : null;

          return (
            <Card
              key={plan.id}
              variant={plan.recommended ? 'filled' : 'outline'}
              style={[
                styles.planCard,
                plan.recommended ? { borderWidth: 2, borderColor: colors.tint } : null,
              ]}>
              {plan.recommended && plan.id !== currentPlan && (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <ThemedText style={styles.badgeText}>おすすめ</ThemedText>
                </View>
              )}
              {plan.id === currentPlan && (
                <View style={[styles.badge, { backgroundColor: colors.success }]}>
                  <ThemedText style={styles.badgeText}>利用中</ThemedText>
                </View>
              )}

              <View style={styles.planHeaderRow}>
                <ThemedText style={styles.planLabel}>{plan.label}</ThemedText>
                <View style={[styles.taglineChip, { backgroundColor: colors.card }]}>
                  <ThemedText style={[styles.taglineText, { color: colors.tint }]}>
                    {plan.tagline}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={[styles.planPrice, { color: colors.tint }]}>
                {plan.price === null
                  ? '0円'
                  : cycle === 'monthly'
                    ? `${formatYen(plan.price.monthly)} / 月`
                    : `${formatYen(plan.price.yearly)} / 年`}
              </ThemedText>

              {dailyPrice !== null && (
                <ThemedText style={styles.dailyPriceText}>
                  1日あたり約{dailyPrice}円
                </ThemedText>
              )}

              {plan.id === 'pro' && (
                <ThemedText style={[styles.paybackText, { color: colors.success }]}>
                  💡 月1回のムダ買いに気づけば元が取れます
                </ThemedText>
              )}

              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <View key={feature.label} style={styles.featureRow}>
                    <ThemedText
                      style={[
                        styles.featureCheck,
                        { color: feature.included ? colors.success : colors.placeholder },
                      ]}>
                      {feature.included ? '✓' : '✕'}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.featureText,
                        !feature.included && { color: colors.placeholder },
                      ]}>
                      {feature.label}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <AppButton
                label={plan.id === currentPlan ? '現在のプランです' : plan.ctaLabel}
                variant={plan.recommended ? 'primary' : 'primaryOutline'}
                disabled={plan.id === currentPlan}
                onPress={() => handleSelectPlan(plan)}
              />
            </Card>
          );
        })}

        <ThemedText style={styles.footnote}>
          価格はすべて税込です。プランはいつでも変更・解約できます。
        </ThemedText>
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
    gap: 20,
  },
  headerSection: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  subheadline: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  currentPlanText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 4,
  },
  planCard: {
    gap: 12,
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  planLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  taglineChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  dailyPriceText: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: -8,
  },
  paybackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },
});
