export type Category = {
  emoji: string;
  name: string;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { emoji: "🍔", name: "Makan" },
  { emoji: "🛒", name: "Belanja" },
  { emoji: "🚗", name: "Transport" },
  { emoji: "🏠", name: "Rumah" },
  { emoji: "⚡", name: "Tagihan" },
  { emoji: "🎮", name: "Hiburan" },
  { emoji: "💊", name: "Kesehatan" },
  { emoji: "📱", name: "Digital" },
  { emoji: "☕", name: "Ngopi" },
  { emoji: "🎓", name: "Pendidikan" },
  { emoji: "👕", name: "Fashion" },
  { emoji: "📦", name: "Lainnya" },
];

export const INCOME_CATEGORIES: Category[] = [
  { emoji: "💰", name: "Gaji" },
  { emoji: "📈", name: "Investasi" },
  { emoji: "🎁", name: "Bonus" },
  { emoji: "💸", name: "Pemberian" },
  { emoji: "📦", name: "Lainnya" },
];

export function getCategoryEmoji(categoryName: string, isIncome = false): string {
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  return found?.emoji ?? "📌";
}
