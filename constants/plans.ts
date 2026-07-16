export type PlanId = 'free' | 'plus' | 'pro';

export interface PlanPrice {
  monthly: number;
  yearly: number;
}

export interface PlanFeature {
  label: string;
  /** false の場合は「非対応・制限あり」として控えめに表示する。 */
  included: boolean;
}

export interface Plan {
  id: PlanId;
  label: string;
  /** 無料プランはnull。 */
  price: PlanPrice | null;
  /** プランの魅力を一言で表す短いキャッチ。 */
  tagline: string;
  features: PlanFeature[];
  /** おすすめプランとして強調表示する。 */
  recommended?: boolean;
  ctaLabel: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Free',
    price: null,
    tagline: 'まずは試したい方向け',
    features: [
      { label: '支出記録 月30件まで', included: true },
      { label: 'OCR 月5回まで', included: true },
      { label: '基本グラフ', included: true },
      { label: '写真添付', included: true },
      { label: '月別合計', included: true },
      { label: 'ムダ買い分析・買い物パターン分析・節約ミッションは一部プレビューのみ', included: true },
      { label: 'よく買うものランキングは一部プレビューのみ', included: true },
      { label: 'CSV出力', included: false },
      { label: 'バックアップ・復元は制限あり', included: false },
    ],
    ctaLabel: '無料で続ける',
  },
  {
    id: 'plus',
    label: 'Plus',
    price: { monthly: 280, yearly: 2800 },
    tagline: '記録をもっとラクに',
    features: [
      { label: '支出記録 無制限', included: true },
      { label: 'OCR 月50回', included: true },
      { label: '広告なし', included: true },
      { label: 'CSV出力', included: true },
      { label: 'バックアップ・復元', included: true },
      { label: '予算アラート', included: true },
      { label: '検索・フィルター', included: true },
      { label: '月別レポート', included: true },
    ],
    ctaLabel: 'Plusを選ぶ',
  },
  {
    id: 'pro',
    label: 'Pro',
    price: { monthly: 480, yearly: 4800 },
    tagline: 'ムダ買いに気づいて自然に節約',
    recommended: true,
    features: [
      { label: 'Plusの全機能', included: true },
      { label: 'OCR 月200回', included: true },
      { label: 'ムダ買い発見', included: true },
      { label: '買い物パターン分析', included: true },
      { label: '節約ミッション', included: true },
      { label: 'よく買うものランキング', included: true },
      { label: '月次アドバイス', included: true },
      { label: '詳細レポート', included: true },
      { label: 'Pro専用テーマ', included: true },
    ],
    ctaLabel: 'Proを試す',
  },
];
