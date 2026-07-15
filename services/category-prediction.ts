import { getCategoryById } from '@/constants/categories';
import { getExpenses } from '@/services/expense-storage';
import type { CategoryId, Expense } from '@/types/expense';

export interface CategoryCandidate {
  categoryId: CategoryId;
  categoryName: string;
  reason: string;
  confidence: number;
}

export type CategoryPredictionInput = {
  storeName?: string;
  memo?: string;
  ocrText?: string;
};

const HISTORY_EXACT_CONFIDENCE = 0.95;
const HISTORY_FUZZY_CONFIDENCE = 0.75;
const KEYWORD_CONFIDENCE = 0.8;
const FALLBACK_CONFIDENCE = 0.3;

const KEYWORD_RULES: { keyword: string; categoryIds: CategoryId[] }[] = [
  { keyword: 'スーパー', categoryIds: ['food'] },
  { keyword: 'コンビニ', categoryIds: ['food'] },
  { keyword: '食品', categoryIds: ['food'] },
  { keyword: '弁当', categoryIds: ['food'] },
  { keyword: 'カフェ', categoryIds: ['food'] },
  { keyword: 'レストラン', categoryIds: ['food'] },
  { keyword: '飲食', categoryIds: ['food'] },
  { keyword: 'マクドナルド', categoryIds: ['food'] },
  { keyword: 'スターバックス', categoryIds: ['food'] },
  { keyword: '薬局', categoryIds: ['daily', 'medical'] },
  { keyword: 'ドラッグストア', categoryIds: ['daily', 'medical'] },
  { keyword: '日用品', categoryIds: ['daily'] },
  { keyword: '洗剤', categoryIds: ['daily'] },
  { keyword: 'ティッシュ', categoryIds: ['daily'] },
  { keyword: 'シャンプー', categoryIds: ['daily'] },
  { keyword: 'コスメ', categoryIds: ['daily'] },
  { keyword: '病院', categoryIds: ['medical'] },
  { keyword: 'クリニック', categoryIds: ['medical'] },
  { keyword: '歯科', categoryIds: ['medical'] },
  { keyword: '薬', categoryIds: ['medical'] },
  { keyword: '処方箋', categoryIds: ['medical'] },
  { keyword: '医療', categoryIds: ['medical'] },
  { keyword: '電車', categoryIds: ['transport'] },
  { keyword: 'バス', categoryIds: ['transport'] },
  { keyword: 'タクシー', categoryIds: ['transport'] },
  { keyword: '交通', categoryIds: ['transport'] },
  { keyword: '駅', categoryIds: ['transport'] },
  { keyword: '駐車場', categoryIds: ['transport'] },
  { keyword: 'ガソリン', categoryIds: ['transport'] },
  { keyword: '映画', categoryIds: ['entertainment'] },
  { keyword: 'ゲーム', categoryIds: ['entertainment'] },
  { keyword: 'カラオケ', categoryIds: ['entertainment'] },
  { keyword: '娯楽', categoryIds: ['entertainment'] },
  { keyword: 'イベント', categoryIds: ['entertainment'] },
  { keyword: 'チケット', categoryIds: ['entertainment'] },
  { keyword: '本', categoryIds: ['entertainment'] },
  { keyword: '漫画', categoryIds: ['entertainment'] },
  { keyword: '服', categoryIds: ['fashion'] },
  { keyword: '衣服', categoryIds: ['fashion'] },
  { keyword: 'ユニクロ', categoryIds: ['fashion'] },
  { keyword: 'GU', categoryIds: ['fashion'] },
  { keyword: 'しまむら', categoryIds: ['fashion'] },
  { keyword: '靴', categoryIds: ['fashion'] },
  { keyword: 'アパレル', categoryIds: ['fashion'] },
  { keyword: '通信', categoryIds: ['communication'] },
  { keyword: 'スマホ', categoryIds: ['communication'] },
  { keyword: '携帯', categoryIds: ['communication'] },
  { keyword: 'インターネット', categoryIds: ['communication'] },
  { keyword: 'Wi-Fi', categoryIds: ['communication'] },
  { keyword: 'サブスク', categoryIds: ['communication'] },
];

function normalizeStoreKey(value: string): string {
  return value.trim();
}

function isFuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

function toCandidate(categoryId: CategoryId, reason: string, confidence: number): CategoryCandidate {
  return {
    categoryId,
    categoryName: getCategoryById(categoryId).label,
    reason,
    confidence,
  };
}

function latestByUpdatedAt(expenses: Expense[]): Expense {
  return [...expenses].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
}

/** 同じ店名（完全一致・あいまい一致）で過去に登録された支出から、カテゴリ候補を探す。 */
async function getHistoryCandidate(storeName: string): Promise<CategoryCandidate | null> {
  const key = normalizeStoreKey(storeName);
  if (!key) return null;

  const expenses = await getExpenses();
  const withMemo = expenses.filter((expense) => (expense.memo ?? '').trim().length > 0);

  const exactMatches = withMemo.filter((expense) => normalizeStoreKey(expense.memo ?? '') === key);
  if (exactMatches.length > 0) {
    const latest = latestByUpdatedAt(exactMatches);
    return toCandidate(
      latest.categoryId,
      `「${latest.memo}」は過去に${getCategoryById(latest.categoryId).label}として登録されています`,
      HISTORY_EXACT_CONFIDENCE
    );
  }

  const fuzzyMatches = withMemo.filter((expense) => isFuzzyMatch(normalizeStoreKey(expense.memo ?? ''), key));
  if (fuzzyMatches.length > 0) {
    const latest = latestByUpdatedAt(fuzzyMatches);
    return toCandidate(
      latest.categoryId,
      `似た店名「${latest.memo}」が過去に${getCategoryById(latest.categoryId).label}として登録されています`,
      HISTORY_FUZZY_CONFIDENCE
    );
  }

  return null;
}

/** キーワードルールに基づくカテゴリ候補を返す（1つのキーワードが複数カテゴリの候補になることもある）。 */
function getKeywordCandidates(text: string): CategoryCandidate[] {
  const candidates: CategoryCandidate[] = [];

  for (const rule of KEYWORD_RULES) {
    if (!text.includes(rule.keyword)) continue;

    for (const categoryId of rule.categoryIds) {
      candidates.push(
        toCandidate(
          categoryId,
          `「${rule.keyword}」という文字から${getCategoryById(categoryId).label}と判定しました`,
          KEYWORD_CONFIDENCE
        )
      );
    }
  }

  return candidates;
}

/**
 * 店名・メモ・OCRテキストから、カテゴリ候補を確信度付きで複数返す（確信度の高い順）。
 * 判定の優先順位: 同じ店名の過去履歴（完全一致） > 似た店名の過去履歴 > キーワードルール。
 * 何も判定できない場合は「その他」の候補を1件返す。
 *
 * 現在はローカルのルールベース実装だが、将来AI APIに置き換える場合もこの関数のシグネチャ
 * （入力・出力の形）はそのまま維持できるように設計している。
 */
export async function predictCategoryCandidates(
  input: CategoryPredictionInput
): Promise<CategoryCandidate[]> {
  const storeName = (input.storeName ?? input.memo ?? '').trim();
  const combinedText = [input.storeName, input.memo, input.ocrText].filter(Boolean).join('\n');

  const candidates: CategoryCandidate[] = [];

  if (storeName) {
    const historyCandidate = await getHistoryCandidate(storeName);
    if (historyCandidate) candidates.push(historyCandidate);
  }

  if (combinedText.trim()) {
    candidates.push(...getKeywordCandidates(combinedText));
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  const seen = new Set<CategoryId>();
  const deduped = candidates.filter((candidate) => {
    if (seen.has(candidate.categoryId)) return false;
    seen.add(candidate.categoryId);
    return true;
  });

  if (deduped.length === 0) {
    return [toCandidate('other', '判定できる情報が見つからなかったため「その他」としました', FALLBACK_CONFIDENCE)];
  }

  return deduped;
}
