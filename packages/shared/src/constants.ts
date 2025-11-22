export const CURRENCIES = [
  { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng' },
  { code: 'USD', symbol: '$', name: 'Đô la Mỹ' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Yên Nhật' },
  { code: 'GBP', symbol: '£', name: 'Bảng Anh' },
  { code: 'AUD', symbol: 'A$', name: 'Đô la Úc' },
  { code: 'CNY', symbol: '¥', name: 'Nhân dân tệ' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Ăn uống', icon: '🍴' },
  { value: 'transport', label: 'Xe cộ', icon: '🚗' },
  { value: 'shopping', label: 'Mua sắm', icon: '🛍️' },
  { value: 'health', label: 'Y tế', icon: '⚕️' },
  { value: 'education', label: 'Giáo dục', icon: '📚' },
  { value: 'entertainment', label: 'Giải trí', icon: '🎬' },
  { value: 'utilities', label: 'Tiện nhà', icon: '🏠' },
  { value: 'other', label: 'Khác', icon: '💸' },
] as const;

export const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
] as const;
