import type { Category, CategoryId } from '@/types/expense';

export const CATEGORIES: Category[] = [
  { id: 'food', label: '食費', color: '#FF6B6B', emoji: '🍚' },
  { id: 'transport', label: '交通費', color: '#4D96FF', emoji: '🚃' },
  { id: 'daily', label: '日用品', color: '#6BCB77', emoji: '🧻' },
  { id: 'housing', label: '住居費', color: '#FFD93D', emoji: '🏠' },
  { id: 'entertainment', label: '娯楽', color: '#C34A9E', emoji: '🎮' },
  { id: 'medical', label: '医療', color: '#00C2CB', emoji: '💊' },
  { id: 'social', label: '交際費', color: '#F7A072', emoji: '🍻' },
  { id: 'fashion', label: '衣服・美容', color: '#B983FF', emoji: '👕' },
  { id: 'communication', label: '通信費', color: '#5C7AEA', emoji: '📱' },
  { id: 'other', label: 'その他', color: '#A0A0A0', emoji: '📦' },
];

export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
