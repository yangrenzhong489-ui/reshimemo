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
  /** ISO 8601形式の作成日時（並び替え用） */
  createdAt: string;
}
