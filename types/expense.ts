export type CategoryId =
  | 'food'
  | 'transport'
  | 'daily'
  | 'housing'
  | 'entertainment'
  | 'medical'
  | 'social'
  | 'fashion'
  | 'communication'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  emoji: string;
}

export interface Expense {
  id: string;
  /** 'YYYY-MM-DD' 形式の支出日 */
  date: string;
  amount: number;
  categoryId: CategoryId;
  memo?: string;
  photoUri?: string;
  /** レシート写真からOCRで読み取ったテキスト */
  ocrText?: string;
  /** ISO 8601形式の作成日時（並び替え用） */
  createdAt: string;
  /** ISO 8601形式の更新日時（未編集の場合はcreatedAtと同じ） */
  updatedAt: string;
}
